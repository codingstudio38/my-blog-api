const moment = require('moment-timezone');
const mongooseConnect = require('../Config/MongooseConfig');
const mongoose = require('mongoose');
const mongodb = require('mongodb');
const Schema = new mongooseConnect.Schema({
    from: { type: 'ObjectId', required: true, trim: true, },
    to: { type: 'ObjectId', required: true, trim: true, },
    accept_status: { type: Number, required: true, default: 0 },
    delete: { type: Number, required: false, default: 0 },
    created_at: { type: Date, required: true, default: moment().tz(process.env.TIMEZONE).format('YYYY-MM-DD HH:mm:ss') },//new Date()
    updated_at: { type: Date, required: false, default: null },
});
Schema.methods.checkFriendRequest = async function (from, to) {
    try {
        return await mongoose.model('users_friend_request').aggregate([
            {
                $match: {
                    $or: [
                        { $and: [{ 'from': new mongodb.ObjectId(from) }, { 'to': new mongodb.ObjectId(to) }] },
                        { $and: [{ 'from': new mongodb.ObjectId(to) }, { 'to': new mongodb.ObjectId(from) }] }
                    ],
                    delete: 0
                }
            },
            {
                $lookup: {
                    from: "users", // collection name (not model name)
                    localField: "from",
                    foreignField: "_id",
                    as: "from_user_detail"
                }
            },
            { $unwind: { path: "$from_user_detail", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: "users",
                    localField: "to",
                    foreignField: "_id",
                    as: "to_user_detail"
                }
            },
            { $unwind: { path: "$to_user_detail", preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    from: 1,
                    to: 1,
                    from_user_name: "$from_user_detail.name",
                    from_user_photo: "$from_user_detail.photo",
                    to_user_name: "$to_user_detail.name",
                    to_user_photo: "$to_user_detail.photo",
                    accept_status: 1,
                    created_at: 1,
                }
            }
        ]);
    } catch (error) {
        throw new Error(error);
    }
}
const UsersFriendRequestModel = mongooseConnect.model('users_friend_request', Schema);
module.exports = UsersFriendRequestModel;
