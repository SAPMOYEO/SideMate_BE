const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = Schema({
    email: {
        type: String,
        required: true
    },password: {
        type: String,
        required: true
    },nickname: {
        type: String,
        required: true
    },role: {
        type: String,
        required: true
    },profile: {
        type: {
            gender: {
                type: String
            },techStack: {
                type: [String]
            },gitUrl: {
                type: String
            }
        }
    },tier: {
        type: String,
        required: true,
        default: 'FREE'
    }
}, {timestamps: true});

userSchema.method.toJSON = function() {
    const obj = this._doc;
    delete obj._v;

    return obj;
};

const User = mongoose.model('User', userSchema);
module.exports = User;