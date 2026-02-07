import moment from "moment-timezone";
import mongoose from "mongoose";
import mongodb from "mongodb";
import mongooseConnect from "../Config/MongooseConfig.js";

const UsersFriendSchema = new mongooseConnect.Schema({
    requestid: { type: "ObjectId", required: true, trim: true },
    userid: { type: "ObjectId", required: true, trim: true },
    friend: { type: "ObjectId", required: true, trim: true },

    delete: { type: Number, default: 0 },

    created_at: {
        type: Date,
        required: true,
        default: () => moment().tz(process.env.TIMEZONE).format("YYYY-MM-DD HH:mm:ss"),
    },

    updated_at: { type: Date, default: null },
});
UsersFriendSchema.methods.IsFriend = async function (userid, friendid) {
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
UsersFriendSchema.methods.MyFriend = async function (userid, friendid) {
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
UsersFriendSchema.methods.getAllMyFriendByid = async function (userid) {
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
UsersFriendSchema.methods.getAllMyFriendFromUsersModalByid = async function (userid) {
    try {
        return await mongoose.model('users').aggregate([
            {
                $match: {
                    $and: [
                        { 'delete': 0 },
                    ],
                }
            },
            {
                $lookup: {
                    from: "users_friends",
                    let: { friendId: "$_id", loggedinuserid: new mongodb.ObjectId(userid) },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$userid", "$$loggedinuserid"] },
                                        { $eq: ["$friend", "$$friendId"] },
                                        { $eq: ["$delete", 0] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: "friendship"
                }
            },
            {
                $addFields: {
                    is_friend: { $size: "$friendship" }
                }
            },
            {
                $lookup: {
                    from: "users_friends",
                    let: { friendId: "$_id", loggedinuserid: new mongodb.ObjectId(userid) },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$userid", "$$loggedinuserid"] },
                                        { $eq: ["$friend", "$$friendId"] },
                                        { $eq: ["$delete", 0] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: "friendship_details"
                }
            },
            { $unwind: { path: "$friendship_details", preserveNullAndEmptyArrays: true } },
            {
                $match: {
                    is_friend: { $gt: 0 }
                }
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    phone: 1,
                    email: 1,
                    photo: 1,
                    password: 1,
                    occupation: 1,
                    skills: 1,
                    dob: 1,
                    country: 1,
                    address: 1,
                    about_us: 1,
                    active_status: 1,
                    created_at: 1,
                    updated_at: 1,
                    wsstatus: 1,
                    requestid: '$friendship_details.requestid',
                },
            },
        ]);
    } catch (error) {
        throw new Error(error);
    }
}
const UsersFriendModel = mongooseConnect.model(
    "users_friends",
    UsersFriendSchema
);

export default UsersFriendModel;
