const moment = require('moment-timezone');
const mongooseConnect = require('../Config/MongooseConfig');
const mongoose = require('mongoose');
const mongodb = require('mongodb');
const Schema = new mongooseConnect.Schema({
    requestid: { type: 'ObjectId', required: true, trim: true, },
    userid: { type: 'ObjectId', required: true, trim: true, },
    friend: { type: 'ObjectId', required: true, trim: true, },
    delete: { type: Number, required: false, default: 0 },
    created_at: { type: Date, required: true, default: moment().tz(process.env.TIMEZONE).format('YYYY-MM-DD HH:mm:ss') },//new Date()
    updated_at: { type: Date, required: false, default: null },
});
Schema.methods.IsFriend = async function (userid, friendid) {
    try {
        return await mongoose.model('users_friends').find({
            $and: [
                { 'userid': new mongodb.ObjectId(userid) },
                { 'friend': new mongodb.ObjectId(friendid) },
                { 'delete': 0 }
            ]
        }).countDocuments();
    } catch (error) {
        throw new Error(error);
    }
}
const UsersFriendModel = mongooseConnect.model('users_friends', Schema);
module.exports = UsersFriendModel;
