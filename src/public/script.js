const meeting = new Metered.Meeting();
let meetingId = "";
var participantName = "";
var token = "";
var currentActiveSpeaker = "";
let scenary = document.getElementsByClassName("Scenary")[0];
// create dish
let dish = new Dish(scenary);
let stateScenary = 1;

var socket = io();

$("#joinPrivate").on("click", () => {
    if ($("#joinPrivate").prop("checked") == true) {
        console.log("join Private");
        $("#creatingFormJoin").append(`
        <div class="relative" id="roomPasswordFormJoin">
            <input id="roomPasswordJoin" type="password" placeholder="Room password"
                            class="w-full pr-16 input input-primary input-bordered" />
        </div>
        `)
    } else {
        $("#roomPasswordFormJoin").remove();
    }
})


$("#goBackHomeJoin").on("click", () => {
    $("#joinView").removeClass("hidden");
    $("#joinArea").addClass("hidden");
})

$("#submitJoin").on("click", async function (e) {
    if (e) e.preventDefault();
    let roomPassword = $("#roomPasswordJoin").val() || "";
    let meetingID = $("#joinMeetingID").val();
    let isPrivate = $("#joinPrivate").prop("checked");
    let adminPassword = $("#joinAdminPass").val() || "";

    if (!meetingID) {
        return alert("Please enter meeting ID");
    }

    // Sending request to validate meeting id
    try {

        const checkValidID = await axios.get("/validate-meeting?meetingId=" + meetingID);

        const checkAuth = await axios.post("/auth-meeting", {
            meetingID: meetingID,
            adminPassword: adminPassword,
            isPrivate: isPrivate,
            roomPassword: roomPassword 
        });

        if (!checkValidID.data.success)
            throw "Meeting ID is invalid";;
        if (!checkAuth.data.success) {
            throw checkAuth.data.error;
        }

        meetingId = meetingID;
        token = checkAuth.data.token;
        // Meeting id is valid, taking the user to the waiting area.
        $("#joinView").addClass("hidden")
        $("#joinArea").addClass("hidden")
        $("#waitingArea").removeClass("hidden");
        $("#displayMeetingId").text(meetingId);
        $("#meetingIdContainer").removeClass("hidden");
        initializeWaitingArea();
    } catch (ex) {
        alert(ex);
    }
    
});

$("#joinExistingMeeting").on("click", async function (e) {
    if (e) e.preventDefault();


    $("#joinView").addClass("hidden");
    $("#joinArea").removeClass("hidden");
    
});



$("#createPrivate").on("click", () => {
    if ($("#createPrivate").prop("checked") == true) {
        console.log("create Private");
        $("#creatingForm").append(`
        <div class="relative" id="roomPasswordForm">
            <input id="roomPassword" type="password" placeholder="Room password"
                            class="w-full pr-16 input input-primary input-bordered" />
        </div>
        `)
    } else {
        $("#roomPasswordForm").remove();
    }
})



$("#goBackHomeCreate").on("click", () => {
    $("#joinView").removeClass("hidden");
    $("#creatingArea").addClass("hidden");
})


$("#submitCreate").on("click", async function (e) {
    try {
        if (e) e.preventDefault();
        let meetingID = $("#inputMeetingID").val() || "";
        let adminPassword = $("#createAdminPass").val() || "";
        let isPrivate = $("#createPrivate").prop("checked");
        let roomPassword = $("#roomPassword").val();

        if (!meetingID.match(/^[A-Za-z0-9-.]+$/)) 
            throw "Meeting ID can only contains 'A-Z''a-z''0-9''-' characters";
        if (adminPassword.length == 0) 
            throw "Please enter admin password";

        const response = await axios.post("/create-meeting-room", {
            meetingID: meetingID,
            adminPassword: adminPassword,
            isPrivate: isPrivate,
            roomPassword: roomPassword || ""
        });
        if (!response.data.success)     
            throw response.data.error;
        $("#submitCreate").text("Create success");
        $("#submitCreate").mouseout(() => {
            $("#submitCreate").text("Create");
        })
     
            
    } catch (error) {
        alert(error);
    }
    
});

$("#createANewMeeting").on("click", async function (e) {
    if (e) e.preventDefault();

    // Sending request to create a new meeting room
    try {
        $("#joinView").addClass("hidden");
        $("#creatingArea").removeClass("hidden");
        // const response = await axios.post("/create-meeting-room");
        // if (response.data.success) {
        //     $("#joinView").addClass("hidden")
        //     $("#waitingArea").removeClass("hidden");
        //     $("#displayMeetingId").text(response.data.roomName);
        //     $("#meetingIdContainer").removeClass("hidden");
        //     meetingId = response.data.roomName;
        //     initializeWaitingArea();
        // }
    } catch (ex) {
        alert("Error occurred when creating a new meeting");
    }
});




/**
 * Method to initialize the waiting area:
 * This methods calls the SDK methods to request the 
 * user for microphone and camera permissions.
 */
var videoUnavailable = true;
var audioUnavailable = true;
async function initializeWaitingArea() {
    let audioOutputDevices = [];
    try {
        audioOutputDevices = await meeting.listAudioOutputDevices()
    } catch (ex) {
        console.log("option not available - it is unsupported in firefox", ex);
    }

    let audioInputDevices = [];
    try {
        audioInputDevices = await meeting.listAudioInputDevices();
    } catch (ex) {
        console.log("camera not available or have disabled camera access", ex);
        audioUnavailable = true;
        // Disabling the camera button
        $("#waitingAreaMicrophoneButton").attr("disabled", true)
    }

    let videoInputDevices = [];
    try {
        videoInputDevices = await meeting.listVideoInputDevices()
    } catch (ex) {
        console.log("camera not available or have disabled camera access", ex);
        videoUnavailable = true;
        // Disabling the camera button
        $("#waitingAreaCameraButton").attr("disabled", true)
    }



    let cameraOptions = [];
    for (let device of videoInputDevices) {
        cameraOptions.push(
            `<option value="${device.deviceId}">${device.label}</option>`
        )
    }
    let microphoneOptions = [];
    for (let device of audioInputDevices) {
        microphoneOptions.push(
            `<option value="${device.deviceId}">${device.label}</option>`
        )
    }
    let speakerOptions = [];
    for (let device of audioOutputDevices) {
        speakerOptions.push(
            `<option value="${device.deviceId}">${device.label}</option>`
        )
    }

    $("#cameras").html(cameraOptions.join(""));
    $("#microphones").html(microphoneOptions.join(""));
    $("#speakers").html(speakerOptions.join(""));

    // Selecting different camera
    $("#cameras").on("change", async function (value) {
        const deviceId = $("#cameras").val();
        console.log(deviceId);
        await meeting.chooseVideoInputDevice(deviceId);
    });

    // Setting different microphone
    $("#microphones").on("change", async function (value) {
        const deviceId = $("#microphones").val();
        await meeting.chooseAudioInputDevice(deviceId);
    });

    // Setting different speaker
    $("#speakers").on("change", async function (value) {
        const deviceId = $("#speakers").val();
        await meeting.chooseAudioOutputDevice(deviceId);
    });

}


/**
 * Adding click events to buttons in waiting area
 */
let microphoneOn = false;
$("#waitingAreaMicrophoneButton").on("click", function () {
    if (microphoneOn) {
        $("#waitingAreaMicrophoneButton").removeClass("bg-accent");
        microphoneOn = false;
    } else {
        microphoneOn = true;
        $("#waitingAreaMicrophoneButton").addClass("bg-accent");
    }
});

let cameraOn = false;
let localVideoStream = null;
$("#waitingAreaCameraButton").on("click", async function () {
    if (cameraOn) {
        cameraOn = false;
        $("#waitingAreaCameraButton").removeClass("bg-accent");
        const tracks = localVideoStream.getTracks();
        tracks.forEach(function (track) {
            track.stop();
        });
        localVideoStream = null;
        $("#waitingAreaVideoTag")[0].srcObject = null;
    } else {
        try {
            $("#waitingAreaCameraButton").addClass("bg-accent");
            localVideoStream = await meeting.getLocalVideoStream();
            $("#waitingAreaVideoTag")[0].srcObject = localVideoStream;
            cameraOn = true;

        } catch (ex) {
            $("#waitingAreaCameraButton").removeClass("bg-accent");
            console.log("Error occurred when trying to acquire video stream", ex);
            $("#waitingAreaCameraButton").attr("disabled", true)
        }
    }

});


let meetingInfo = {};
$("#joinMeetingButton").on("click", async function () {
    var username = $("#username").val();
    if (!username) {
        return alert("Please enter a username");
    }

    try {
        console.log(meetingId)

        const {
            data
        } = await axios.get("/metered-domain");
        console.log(data.domain)

        meetingInfo = await meeting.join({
            roomURL: `${data.domain}/${meetingId}`,
            name: username,
            accessToken: token
        });
        console.log("Meeting joined", meetingInfo);
        $("#waitingArea").addClass("hidden");
        $("#meetingView").removeClass("hidden");

        dish.join(meeting.participantSessionId, username);
        participantName = username;
        // dish.playAll();

        if (cameraOn) {
            $("#meetingViewCamera").addClass("bg-accent");
            if (localVideoStream) {
                const tracks = localVideoStream.getTracks();
                tracks.forEach(function (track) {
                    track.stop();
                });
                localVideoStream = null;
            }
            await meeting.startVideo();
        }

        if (microphoneOn) {
            $("#meetingViewMicrophone").addClass("bg-accent");
            await meeting.startAudio();
        }
        socket.emit('join room', meetingId);
        socket.on('chat message', (senderName, msg) => {
            console.log("RECEIVED MSG");
            const today = new Date()
            let message = `
                <div class="chatbox-message-item received">
                    <div style="color: green;">${senderName}</div>
                    <span class="chatbox-message-item-text">
                        ${msg}
                    </span>
                    <span class="chatbox-message-item-time">${addZero(today.getHours())}:${addZero(today.getMinutes())}</span>
                </div>
            `
            chatboxMessageWrapper.insertAdjacentHTML('beforeend', message)
            scrollBottom();
        });

    } catch (ex) {
        console.log("Error occurred when joining the meetingg", ex);
    }
});

/**
 * Adding click events to buttons in Meeting Area
 */
$("#meetingViewMicrophone").on("click", async function () {
    if (microphoneOn) {
        microphoneOn = false;
        $("#meetingViewMicrophone").removeClass("bg-accent");
        await meeting.stopAudio();
    } else {
        microphoneOn = true;
        $("#meetingViewMicrophone").addClass("bg-accent");
        await meeting.startAudio();
    }
});

$("#meetingViewCamera").on("click", async function () {
    console.log(cameraOn);
    if (cameraOn) {
        cameraOn = false;
        $("#meetingViewCamera").removeClass("bg-accent");
        await meeting.stopVideo();
    } else {
        cameraOn = true;
        $("#meetingViewCamera").addClass("bg-accent");
        await meeting.startVideo();
    }
});

let screenSharing = false;
$("#meetingViewScreen").on("click", async function () {
    if (screenSharing) {
        $("#meetingViewScreen").removeClass("bg-accent");
        await meeting.stopVideo();
        screenSharing = false;
        return;
    } else {
        try {
            await meeting.startScreenShare();
            screenSharing = true;
            cameraOn = false;
            $("#meetingViewCamera").removeClass("bg-accent");
            $("#meetingViewScreen").addClass("bg-accent");
        } catch (ex) {
            console.log("Error occurred when trying to share screen", ex);
        }
    }
});


/**
 * Listening to events
 */

meeting.on("localTrackStarted", function (trackItem) {
    if (trackItem.type === "video") {
        let track = trackItem.track;
        let mediaStream = new MediaStream([track]);

        $(`#participant-${meeting.participantSessionId}-video`)[0].srcObject = mediaStream;
        $(`#participant-${meeting.participantSessionId}-video`)[0].play();
    }
});
meeting.on("localTrackUpdated", function (trackItem) {
    if (trackItem.type === "video") {
        let track = trackItem.track;
        let mediaStream = new MediaStream([track]);
        $(`#participant-${meeting.participantSessionId}-video`)[0].srcObject = mediaStream;
    }
});

meeting.on("localTrackStopped", function (localTrackItem) {
    console.log(localTrackItem.type);
    console.log(localTrackItem);
    if (localTrackItem.type === "video") {
        $(`#participant-${meeting.participantSessionId}-video`)[0].srcObject = null;
    }
});


meeting.on("remoteTrackStarted", function (trackItem) {

    if (trackItem.participantSessionId === meeting.participantSessionId) return;
    var track = trackItem.track;
    var mediaStream = new MediaStream([track]);
    $(`#participant-${trackItem.participantSessionId}-${trackItem.type}`)[0].srcObject = mediaStream;
    $(`#participant-${trackItem.participantSessionId}-${trackItem.type}`)[0].play();
});

meeting.on("remoteTrackStopped", function (trackItem) {
    if (trackItem.participantSessionId === meeting.participantSessionId) return;
    if ($(`#participant-${trackItem.participantSessionId}-${trackItem.type}`)[0] != null) {
        $(`#participant-${trackItem.participantSessionId}-${trackItem.type}`)[0].srcObject = null;
    }
});

meeting.on("participantJoined", function (participantInfo) {
    if (participantInfo._id != meeting.participantSessionId) {
        dish.join(participantInfo._id, participantInfo.name);
        // dish.playAll();
    }
});

meeting.on("participantLeft", function (participantInfo) {
    // console.log("participant has left the room", participantInfo);
    // $(`#participant-${participantInfo._id}`).remove();
    // if (currentActiveSpeaker == participantInfo._id) {
    //     $("#activeSpeakerVideo")[0].srcObject = null;
    //     $("#activeSpeakerUsername").text('');
    // }
    console.log(`${participantInfo._id} has left the meeting` )
    dish.left(participantInfo._id);
    // dish.playAll();
});

meeting.on("onlineParticipants", function (onlineParticipants) {

    // $("#remoteParticipantContainer").html("");
    // for (let participantInfo of onlineParticipants) {
    //     if (participantInfo._id !== meeting.participantSessionId) {
    //         var participant =
    //             `<div id="participant-${participantInfo._id}" class="bg-base-300">
    //             <video id="participant-${participantInfo._id}-video" muted autoplay playsinline
    //                 style="padding: 0; margin: 0; width: 150px; height: 100px;"></video>
    //             <audio id="participant-${participantInfo._id}-audio" autoplay playsinline
    //                 style="padding: 0; margin: 0;"></audio>
    //             <div id="participant-${participantInfo._id}-username" class="bg-base-300	" style=" text-align: center;">
    //                 ${participantInfo.name}
    //             </div>
    //         </div>`
    //         $("#remoteParticipantContainer").append(participant)
    //     }
    // }
    for (let participantInfo of onlineParticipants) {
        if (participantInfo._id !== meeting.participantSessionId) {
            dish.join(participantInfo._id, participantInfo.name)
        }
    }
    // dish.playAll();
});


// meeting.on("activeSpeaker", function (activeSpeaker) {
//     if (currentActiveSpeaker === activeSpeaker.participantSessionId) return;

//     $("#activeSpeakerUsername").text(activeSpeaker.name + ' is speaking');
//     currentActiveSpeaker = activeSpeaker.participantSessionId;
//     if ($(`#participant-${activeSpeaker.participantSessionId}-video`)[0]) {
//         let stream = $(`#participant-${activeSpeaker.participantSessionId}-video`)[0].srcObject;
//         $("#activeSpeakerVideo")[0].srcObject = stream.clone();
//     } else {
//         $("#activeSpeakerVideo")[0].srcObject = null;
//     }

//     if (activeSpeaker.participantSessionId === meeting.participantSessionId) {
//         let stream = $(`#meetingAreaLocalVideo`)[0].srcObject;
//         if (stream) {
//             $("#activeSpeakerVideo")[0].srcObject = stream.clone();
//         }

//     }
// });


$("#meetingViewLeave").on("click", async function () {
    socket.emit('leave room', meetingId);
    await meeting.leaveMeeting();
    $("#meetingView").addClass("hidden");
    $("#leaveView").removeClass("hidden");
});
window.addEventListener("load", function () {
    console.log("HELLO ==================");
    // render dish
    dish.append();

    // resize the cameras
    dish.resize();

    // resize event of window
    window.addEventListener("resize", function () {
        // resize event to dimension cameras
        dish.resize();
        console.log("RESIZING ===")
    });
}, false);


$("#meetingViewMessage").on("click", () => {
    console.log("HIHI");
    console.log(stateScenary);
    if (stateScenary == 1) {
        $(".Scenary").css("margin-left", "10px");
        stateScenary = stateScenary * -1;
    } else {
        console.log("CHANGE");
        $(".Scenary").css("margin-left", "12vw");
        stateScenary = stateScenary * -1;
    }
    chatboxMessage.classList.toggle('show');
})

// MESSAGE INPUT
const textarea = $('.chatbox-message-input')[0];

// TOGGLE CHATBOX
const chatboxMessage = $(".chatbox-message-wrapper")[0];

// CHATBOX MESSAGE
const chatboxMessageWrapper = $(".chatbox-message-content")[0];
const chatboxNoMessage = $('.chatbox-message-no-message')[0];
const chatboxForm = $(".chatbox-message-form")[0];
$(".chatbox-message-form").submit((e) => {
	e.preventDefault()
	if(isValid(textarea.value)) {
		writeMessage()
		// setTimeout(autoReply, 1000)
	}
})



function addZero(num) {
	return num < 10 ? '0'+num : num
}

function writeMessage() {
    socket.emit('chat message', meetingId, participantName ,textarea.value.trim().replace(/\n/g, '<br>\n'));
	const today = new Date()
	let message = `
		<div class="chatbox-message-item sent">
            <div style="color: pink">You</div>
			<span class="chatbox-message-item-text">
				${textarea.value.trim().replace(/\n/g, '<br>\n')}
			</span>
			<span class="chatbox-message-item-time">${addZero(today.getHours())}:${addZero(today.getMinutes())}</span>
            
		</div>
	`
	chatboxMessageWrapper.insertAdjacentHTML('beforeend', message)
	chatboxForm.style.alignItems = 'center'
	textarea.rows = 1
	textarea.focus()
	textarea.value = ''
    console.log("000000000000000")
	chatboxNoMessage.style.display = 'none'
	scrollBottom()
}



function autoReply() {
	const today = new Date()
	let message = `
		<div class="chatbox-message-item received">
            <div style="color: green;">Nguyen Van Khoa</div>
			<span class="chatbox-message-item-text">
				Thank you for your awesome support!
			</span>
			<span class="chatbox-message-item-time">${addZero(today.getHours())}:${addZero(today.getMinutes())}</span>
		</div>
	`
	chatboxMessageWrapper.insertAdjacentHTML('beforeend', message)
    scrollBottom();
	
}
$("#scrollDown").on("click", () => {
	scrollBottom();
})

function scrollBottom() {
	chatboxMessageWrapper.scrollTo(0, chatboxMessageWrapper.scrollHeight)
}

function isValid(value) {
	let text = value.replace(/\n/g, '')
	text = text.replace(/\s/g, '')

	return text.length > 0
}

// Socket io for chatting



