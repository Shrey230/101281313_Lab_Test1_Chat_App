const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema({

    username: {
        type: String,
        required: true,
        unique: true
    },
    firstname: {
        type: String
    },
    lastname: {
        type: String
    },
    password: {
        type: String,
        required: true
    },
    createon: {
        type: Date
    }

})

const User = mongoose.model('User', UserSchema)
module.exports = User