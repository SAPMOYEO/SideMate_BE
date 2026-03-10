const mongoose = require('mongoose');
const User = require('./User');
const Project = require('./Project');
const Schema = mongoose.Schema;

const applicationSchema = Schema({
    project: {
        type: mongoose.ObjectId,
        ref: Project,
        required: true
    },applicant: {
        type: mongoose.ObjectId,
        ref: User,
        required: true
    },role: {
        type: String,
        required: true
    },motivation: {
        type: String,
        required: true
    },profileOfferYn: {
        type: Boolean,
        required: true,
        default: false
    },status: {
        type: String,
        required: true,
        default: 'PENDING'
    }
}, {timestamps: true});

applicationSchema.method.toJSON = function() {
    const obj = this._doc;
    delete obj._v;

    return obj;
};

const Application = mongoose.model('Application', applicationSchema);
module.exports = Application;