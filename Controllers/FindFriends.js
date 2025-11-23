const moment = require('moment-timezone');
const UsersModel = require('../Models/UsersModel');
const UsersFriendModel = require('../Models/UsersFriendModel');
const UsersFriendRequestModel = require('../Models/UsersFriendRequestModel');
const Healper = require('./Healper');
const mongodb = require('mongodb');
const APP_STORAGE = process.env.APP_STORAGE;
async function AllUsers(req, resp) {
    try {
        let { limit = 5, page = 1 } = req.query;
        let { title = '', user_id = '' } = req.body;
        let skip = 0, totalpage = 0;
        limit = parseInt(limit);
        page = parseInt(page);
        skip = (page - 1) * limit;

        let andConditions = [];
        if (title !== '') {
            andConditions.push({ name: { $regex: new RegExp(title, "i") } });
        }

        andConditions.push({ delete: 0 });
        andConditions.push({ _id: { $ne: new mongodb.ObjectId(user_id) } });
        let query = andConditions.length > 0 ? { $and: andConditions } : {};

        let list = await UsersModel.aggregate([
            { $match: query },
            {
                $lookup: {
                    from: "users_friends",
                    let: { friendId: "$_id", loggedinuserid: new mongodb.ObjectId(user_id) },
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
            // Count documents & create is_friend field
            {
                $addFields: {
                    is_friend: { $size: "$friendship" }
                }
            },
            {
                $lookup: {
                    from: "users_friend_requests",
                    let: {
                        me: new mongodb.ObjectId(user_id),  // logged user
                        other: "$_id"                       // loop user
                    },
                    pipeline: [
                        {
                            $match: {
                                $expr: {

                                    $and: [
                                        { $eq: ["$delete", 0] },
                                        {
                                            $or: [
                                                {
                                                    $and: [
                                                        { $eq: ["$from", "$$me"] },
                                                        { $eq: ["$to", "$$other"] }
                                                    ]
                                                },
                                                {
                                                    $and: [
                                                        { $eq: ["$from", "$$other"] },
                                                        { $eq: ["$to", "$$me"] }
                                                    ]
                                                }
                                            ]
                                        }
                                    ]

                                }
                            }
                        },
                        // Join the FROM user details
                        {
                            $lookup: {
                                from: "users",
                                localField: "from",
                                foreignField: "_id",
                                as: "from_user_detail"
                            }
                        },
                        { $unwind: { path: "$from_user_detail", preserveNullAndEmptyArrays: true } },

                        // Join the TO user details
                        {
                            $lookup: {
                                from: "users",
                                localField: "to",
                                foreignField: "_id",
                                as: "to_user_detail"
                            }
                        },
                        { $unwind: { path: "$to_user_detail", preserveNullAndEmptyArrays: true } },

                        // Select fields you want
                        {
                            $project: {
                                from: 1,
                                to: 1,
                                accept_status: 1,
                                created_at: 1,

                                from_user_name: "$from_user_detail.name",
                                from_user_photo: "$from_user_detail.photo",

                                to_user_name: "$to_user_detail.name",
                                to_user_photo: "$to_user_detail.photo",
                            }
                        }
                    ],
                    as: "friend_request"
                }
            },
            {
                $addFields: {
                    check_friend_request: { $size: "$friend_request" }
                }
            },
            { $sort: { _id: -1 } },
            { $skip: skip },
            { $limit: limit },
        ]);
        // console.log(list);
        let total = await UsersModel
            .find(query)
            .countDocuments();
        totalpage = Math.ceil(total / limit);
        // const user_friend_model = new UsersFriendModel;
        // const user_friend_request_model = new UsersFriendRequestModel;
        let resetdata_is = await Promise.all(
            list.map(async (element) => {
                let uid = element._id.toString();
                // let totalfriend = await user_friend_model.IsFriend(user_id, uid);
                // let friend_request = await user_friend_request_model.checkFriendRequest(user_id, uid);
                let file_name = element.photo;
                let file_path = `${Healper.storageFolderPath()}users/${file_name}`;
                let file_view_path = `${APP_STORAGE}users/${file_name}`;
                let file_dtl = await Healper.FileInfo(file_name, file_path, file_view_path);
                return {
                    "_id": element._id,
                    "name": element.name,
                    "phone": element.phone,
                    "email": element.email,
                    "photo": element.photo,
                    "occupation": element.occupation == undefined ? "" : element.occupation,
                    "skills": element.skills == undefined ? "" : element.skills,
                    "dob": element.dob == undefined ? null : element.dob == undefined ? null : moment(element.dob).format('YYYY-MM-DD'),
                    "created_at": moment(element.created_at).format('YYYY-MM-DD HH:mm:ss'),
                    "updated_at": element.updated_at == null ? null : moment(element.updated_at).format('YYYY-MM-DD HH:mm:ss'),
                    "user_file_dtl": file_dtl,
                    "address": element.address == undefined ? "" : element.address,
                    "country": element.country == undefined ? "" : element.country,
                    "is_friend": element.is_friend,
                    "friend_request": element.friend_request.length > 0 ? element.friend_request[0] : null,
                    "check_friend_request": element.check_friend_request,
                }
            })
        );

        let data = {
            list: resetdata_is,
            total: total,
            lastpage: totalpage
        };
        return resp.status(200).json({ "status": 200, "message": "Success", 'result': data });
    } catch (error) {
        return resp.status(500).json({ "status": 500, "message": error.message, 'result': {} });
    }
}

async function MyFriends(req, resp) {
    try {
        let { limit = 5, page = 1 } = req.query;
        let { name = '', user_id = '' } = req.body;
        let skip = 0, totalpage = 0;
        limit = parseInt(limit);
        page = parseInt(page);
        skip = (page - 1) * limit;

        let andConditions = [];
        if (name !== '') {
            andConditions.push({ name: { $regex: new RegExp(name, "i") } });
        }

        andConditions.push({ delete: 0 });
        andConditions.push({ _id: { $ne: new mongodb.ObjectId(user_id) } });
        let query = andConditions.length > 0 ? { $and: andConditions } : {};

        let list = await UsersModel.aggregate([
            { $match: query },
            {
                $lookup: {
                    from: "users_friends",
                    let: { friendId: "$_id", loggedinuserid: new mongodb.ObjectId(user_id) },
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
                    let: { friendId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$friend", "$$friendId"] },
                                        { $eq: ["$delete", 0] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: "totalfriend"
                }
            },
            {
                $addFields: {
                    total_friend: { $size: "$totalfriend" }
                }
            },
            {
                $match: {
                    is_friend: { $gt: 0 }
                }
            },
            { $sort: { _id: -1 } },
            { $skip: skip },
            { $limit: limit },
        ]);

        let total = await UsersModel.aggregate([
            { $match: query },
            {
                $lookup: {
                    from: "users_friends",
                    let: { friendId: "$_id", loggedinuserid: new mongodb.ObjectId(user_id) },
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
                    let: { friendId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$friend", "$$friendId"] },
                                        { $eq: ["$delete", 0] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: "totalfriend"
                }
            },
            {
                $addFields: {
                    total_friend: { $size: "$totalfriend" }
                }
            },
            {
                $match: {
                    is_friend: { $gt: 0 }
                }
            },
            { $count: "total" }
        ]);
        total = total.length > 0 ? total[0].total : 0;
        totalpage = Math.ceil(total / limit);
        let resetdata_is = await Promise.all(
            list.map(async (element) => {
                let file_name = element.photo;
                let file_path = `${Healper.storageFolderPath()}users/${file_name}`;
                let file_view_path = `${APP_STORAGE}users/${file_name}`;
                let file_dtl = await Healper.FileInfo(file_name, file_path, file_view_path);
                return {
                    "_id": element._id,
                    "name": element.name,
                    "phone": element.phone,
                    "email": element.email,
                    "photo": element.photo,
                    "occupation": element.occupation == undefined ? "" : element.occupation,
                    "skills": element.skills == undefined ? "" : element.skills,
                    "dob": element.dob == undefined ? null : element.dob == undefined ? null : moment(element.dob).format('YYYY-MM-DD'),
                    "created_at": moment(element.created_at).format('YYYY-MM-DD HH:mm:ss'),
                    "updated_at": element.updated_at == null ? null : moment(element.updated_at).format('YYYY-MM-DD HH:mm:ss'),
                    "user_file_dtl": file_dtl,
                    "address": element.address == undefined ? "" : element.address,
                    "country": element.country == undefined ? "" : element.country,
                    "is_friend": element.is_friend,
                    "total_friend": element.total_friend,
                }
            })
        );

        let data = {
            list: resetdata_is,
            total: total,
            lastpage: totalpage
        };
        return resp.status(200).json({ "status": 200, "message": "Success", 'result': data });
    } catch (error) {
        return resp.status(500).json({ "status": 500, "message": error.message, 'result': {} });
    }
}

module.exports = { AllUsers, MyFriends };