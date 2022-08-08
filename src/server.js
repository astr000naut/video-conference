const path = require("path");
const express = require("express");
var axios = require("axios").default;
const app = express();
const config = require("./config");
const port = config.port;

const mongoose = require('mongoose');

const bcrypt = require('bcrypt');
const saltRounds = 10;

// Check config variable ==============================
if (!config.METERED_DOMAIN) {
    throw new Error("Missing METERED_DOMAIN");
}

if (!config.METERED_SECRET_KEY) {
    throw new Error("Missing METERED_SECRET_KEY");
}

//======================================================

// Init database =======================================

const DB_URL = process.env.DB_URL || "mongodb://localhost:27017";
const DB_NAME = process.env.DB_NAME || "meetingInfo";
mongoose.connect(DB_URL + '/' + DB_NAME);
const db = mongoose.connection;
db.on('error', (e) => {
    console.error(e);
});
db.once('open', () => {
    console.log('Connected to Database');
})

const Meeting = require('./model');

const testDB = async () => {
    try {
        const data = await Meeting.find();
        console.log(data);
    } catch (error) {
        console.log(error);
    }
}
// testDB();

//======================================================


// Init server =========================================
app.use(express.json()) 
// =====================================================

// API End point =======================================
 


//HOME
app.use("/", express.static(path.join(__dirname, "/public")));


// validate meeting ID
app.get("/validate-meeting", async (req, res) => {
    
    let options = {
        method: "GET",
        url:
            "https://" +
            config.METERED_DOMAIN +
            "/api/v1/room/" +
            req.query.meetingId,
        params: {
            secretKey: config.METERED_SECRET_KEY,
        },
        headers: {
            Accept: "application/json"
        }
    };

    axios 
        .request(options)
        .then((response) => {
            console.log(response.data);
            res.send({
                success: true,
            });
        })
        .catch((error) => {
            console.error(error);
            res.send({
                success: false,
            });
        });

});

app.post("/auth-meeting", async (req, res) => {
    try {
        const meetingInfo = await Meeting.findOne(({meetingId: req.body.meetingID}));

        const normalToken = await axios({
            method: 'post',
            url: 
                'https://' +
                config.METERED_DOMAIN +
                '/api/v1/token',
            data: {
                isAdmin: false,
                roomName: req.body.meetingID,
            },
            params: {
                secretKey: config.METERED_SECRET_KEY
            },
        })
        const adminToken = await axios({
            method: 'post',
            url: 
                'https://' +
                config.METERED_DOMAIN +
                '/api/v1/token',
            data: {
                isAdmin: true,
                roomName: req.body.meetingID,
            },
            params: {
                secretKey: config.METERED_SECRET_KEY
            },
        })
        
        console.log(req.body.adminPassword);
        console.log(req.body.roomPassword);
        console.log(meetingInfo);

        if (req.body.roomPassword == "" && meetingInfo.roomPass != "") 
            throw "This meeting is private, please enter password"
        const adminPassCheck = await bcrypt.compare(req.body.adminPassword, meetingInfo.adminPass);
        const roomPassCheck = await bcrypt.compare(req.body.roomPassword, meetingInfo.roomPass);

        if (meetingInfo.roomPass == "") {
            if (req.body.adminPassword == "") {
                // GET NORMAL TOKEN
                res.send({
                    success: true,
                    token: normalToken.data.token
                })
            } else {
                // CHECK ADMIN PASS
                if (!adminPassCheck)
                    throw "Wrong admin password";
                // GET ADMIN TOKEN
                res.send({
                    success: true,
                    token: adminToken.data.token
                })
            }
        } else {
            // CHECK ROOM PASS
            if (!roomPassCheck)
                throw "Wrong room password";

            if (req.body.adminPassword == "") {
                // GET NORMAL TOKEN
                res.send({
                    success: true,
                    token: normalToken.data.token
                })
            } else {
                // CHECK ADMIN PASS
                if (!adminPassCheck)
                    throw "Wrong admin password";
                // GET ADMIN TOKEN
                res.send({
                    success: true,
                    token: adminToken.data.token
                })
            }
        }


    } catch (error) {
        console.log("ERRR+================================");
        console.log(error);
        res.send({
            success: false,
            error: error
        })
    }

});


// create new meeting room
app.post("/create-meeting-room", async (req, res) => {

    try {
        let meetingExisted = await checkRoomExisted(req.body.meetingID);
        if (meetingExisted)
            throw "This meeting ID has existed";

        console.log("BEGIN SENDING ======");
        const response = await axios({
            method: 'post',
            url: "https://" +
                config.METERED_DOMAIN +
                "/api/v1/room/",
            data: {
                roomName: req.body.meetingID,
                privacy: req.body.isPrivate ? 'private' : 'public',
            },
            params: {
                secretKey: config.METERED_SECRET_KEY
            }
        });;

        await Meeting.deleteMany({meetingId: req.body.meetingID});

        let newMeeting = new Meeting({
            meetingId: req.body.meetingID,
            adminPass: bcrypt.hashSync(req.body.adminPassword, saltRounds),
            roomPass: (req.body.isPrivate) ? bcrypt.hashSync(req.body.roomPassword, saltRounds) : ""
        })


        await newMeeting.save();

        res.send({
            success: true,
            ... response.data
        })
        
    } catch (error) {
        console.error(error.response);
        console.error(error.request);
        console.error(error.message);
        res.send({
            error: error
        })
    }
    console.log(req.body);
});

app.get("/metered-domain", (req, res) => {
    res.send({
        domain: config.METERED_DOMAIN
    })

});

//=====================================================



// Start server ========================================
app.listen(port, () => {
    console.log("LISTENING ON PORT 4000")
})

// Gracefull shutdown ==================================

process.on('SIGINT', () => {
    console.log('Received SIGINT. SHUTING DOWN ...');
    mongoose.connection.close()
    process.exit(0);
});


// Other function =======================================

const checkRoomExisted = async (meetingID) => {
    try {
        let options = {
            method: "GET",
            url: "https://" +
                config.METERED_DOMAIN +
                "/api/v1/room/" +
                meetingID,
            params: {
                secretKey: config.METERED_SECRET_KEY,
            },
            headers: {
                Accept: "application/json",
            },
        };
        const response = await axios.request(options);
        if (response.data.roomName == meetingID)
            return true;
        return false;
    } catch (error) {
        return false;
    }
}
  