const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
    meetingId: {
        type: String,
        required: true 
    },
    adminPass: {
        type: String 
    },
    roomPass: {
        type: String 
    }
})

module.exports = mongoose.model('Meeting', meetingSchema);