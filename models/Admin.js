const mongoose = require('mongoose');

const AdminSchema = new mongoose.Schema({
    company: {
        type: String,
        required: true,
    },
    policies: {
        type: String,
        required: true,
    },
});

const Admin = mongoose.model('Admin', AdminSchema);

module.exports = Admin;