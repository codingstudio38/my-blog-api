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
Schema.methods.MyFriend = async function (userid, friendid) {
    try {
       return await mongoose.model('users_friends').aggregate([
            {
                $match: {
                    $and: [
                        { 'userid': new mongodb.ObjectId(userid) },
                        { 'friend': new mongodb.ObjectId(friendid) },
                        { 'delete': 0 },
                    ],
                }
            },
            {
                $lookup: {
                    from: "users", // collection name (not model name)
                    localField: "userid",
                    foreignField: "_id",
                    as: "from_user_details"
                }
            },
            { $unwind: { path: "$from_user_details", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: "users", // collection name (not model name)
                    localField: "friend",
                    foreignField: "_id",
                    as: "to_user_detail"
                }
            },
            { $unwind: { path: "$to_user_detail", preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    _id: 1,
                    requestid: 1,
                    userid: 1,
                    requestid: 1,
                    to_user_name: "$to_user_detail.name",
                    to_user_photo: "$to_user_detail.photo",
                    to_user_id: "$to_user_detail._id",
                    from_user_name: "$from_user_details.name",
                    from_user_photo: "$from_user_details.photo",
                    from_user_id: "$from_user_details._id",
                }
            }
        ]);
    } catch (error) {
        throw new Error(error);
    }
}
Schema.methods.getAllMyFriendByid = async function (userid) {
    try {
        return await mongoose.model('users_friends').aggregate([
            {
                $match: {
                    $and: [
                        { 'userid': new mongodb.ObjectId(userid) },
                        { 'delete': 0 },
                    ],
                }
            },
            {
                $lookup: {
                    from: "users", // collection name (not model name)
                    localField: "userid",
                    foreignField: "_id",
                    as: "from_user_details"
                }
            },
            { $unwind: { path: "$from_user_details", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: "users", // collection name (not model name)
                    localField: "friend",
                    foreignField: "_id",
                    as: "to_user_detail"
                }
            },
            { $unwind: { path: "$to_user_detail", preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    _id: 1,
                    requestid: 1,
                    userid: 1,
                    requestid: 1,
                    to_user_name: "$to_user_detail.name",
                    to_user_photo: "$to_user_detail.photo",
                    to_user_id: "$to_user_detail._id",
                    from_user_name: "$from_user_details.name",
                    from_user_photo: "$from_user_details.photo",
                    from_user_id: "$from_user_details._id",
                }
            }
        ]);
    } catch (error) {
        throw new Error(error);
    }
}
const UsersFriendModel = mongooseConnect.model('users_friends', Schema);
module.exports = UsersFriendModel;
