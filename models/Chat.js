const mongoose = require('mongoose');

const ChatSchema = new mongoose.Schema({
    userName: {
        type: String,
        required: true,
    },
    userMessage: {
        type: String,
        required: true,
    },
    imageUrl: {
        type: String,
        required: false
    },
    responseObject: {
        type: Object,
        required: false,
    },
    botReply: {
        type: String,
        required: true,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
});

const Chat = mongoose.model('Chat', ChatSchema);

module.exports = Chat;