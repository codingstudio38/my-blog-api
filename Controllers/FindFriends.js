// import dotenv from "dotenv";
// dotenv.config();
import moment from "moment-timezone";
import mongodb from "mongodb";

import UsersModel from "../Models/UsersModel.js";
import UsersFriendModel from "../Models/UsersFriendModel.js";
import UsersFriendRequestModel from "../Models/UsersFriendRequestModel.js";
import SharesModel from "../Models/SharesModel.js";

import { PaginationData, generateRandomString, storageFolderPath, FileInfo, DeleteFile, FileExists, data_decrypt, data_encrypt } from "./Healper.js";

const APP_STORAGE = process.env.APP_STORAGE;
export async function AllUsers(req, resp) {
    try {
        let { limit = 5, page = 1 } = req.query;
        let { title = '', user_id = '', listtype = 'not-friend' } = req.body;
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
        // if (listtype == 'not-friend') {
        //     andConditions.push({ is_friend: { $lte: 0 } });
        //     andConditions.push({ check_friend_request: { $lte: 0 } })
        // } else if (listtype == 'my-friend') {
        //     andConditions.push({ is_friend: { $gt: 0 } });
        //     andConditions.push({ check_friend_request: { $gt: 0 } })
        // } else if (listtype == 'already-sent-request') {
        //     andConditions.push({ is_friend: { $lte: 0 } });
        //     andConditions.push({ check_friend_request: { $gt: 0 } })
        // }
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
            {
                $match: {
                    $and: [
                        { is_friend: { $lte: 0 } },
                        { check_friend_request: { $lte: 0 } }
                    ]
                }
            },
            { $sort: { _id: -1 } },
            { $skip: skip },
            { $limit: limit },
        ]);
        // console.log(list);
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
            {
                $match: {
                    $and: [
                        { is_friend: { $lte: 0 } },
                        { check_friend_request: { $lte: 0 } }
                    ]
                }
            },
            { $count: "total" }
        ]);
        totalpage = Math.ceil(total / limit);
        // const user_friend_model = new UsersFriendModel;
        // const user_friend_request_model = new UsersFriendRequestModel;
        let resetdata_is = await Promise.all(
            list.map(async (element) => {
                let uid = element._id.toString();
                // let totalfriend = await user_friend_model.IsFriend(user_id, uid);
                // let friend_request = await user_friend_request_model.checkFriendRequest(user_id, uid);
                let file_name = element.photo;
                let file_path = `${storageFolderPath()}users/${file_name}`;
                let file_view_path = `${APP_STORAGE}users/${file_name}`;
                let file_dtl = await FileInfo(file_name, file_path, file_view_path);
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

export async function MyFriends(req, resp) {
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
            {
                $lookup: {
                    from: "users_chats",
                    let: { from_: "$_id", to_: new mongodb.ObjectId(user_id) },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$from_user", "$$from_"] },
                                        { $eq: ["$to_user", "$$to_"] },
                                        { $eq: ["$read_status", 0] },
                                        { $eq: ["$delete", 0] }
                                    ]
                                }
                            }
                        },
                    ],
                    as: "user_chats"
                }

            },
            {
                $addFields: {
                    total_unread_message: { $size: "$user_chats" }
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
                let file_path = `${storageFolderPath()}users/${file_name}`;
                let file_view_path = `${APP_STORAGE}users/${file_name}`;
                let file_dtl = await FileInfo(file_name, file_path, file_view_path);
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
                    "check_friend_request": element.check_friend_request,
                    "friend_request": element.check_friend_request > 0 ? element.friend_request[0] : null,
                    "wsstatus": element.wsstatus,
                    "total_unread_message": element.total_unread_message,
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

export async function FriendRequestSendList(req, resp) {
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
                                        { $eq: ["$from", "$$me"] },
                                        { $eq: ["$to", "$$other"] },
                                        // {
                                        //     $or: [
                                        //         {
                                        //             $and: [
                                        //                 { $eq: ["$from", "$$me"] },
                                        //                 { $eq: ["$to", "$$other"] }
                                        //             ]
                                        //         },
                                        //         {
                                        //             $and: [
                                        //                 { $eq: ["$from", "$$other"] },
                                        //                 { $eq: ["$to", "$$me"] }
                                        //             ]
                                        //         }
                                        //     ]
                                        // }
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
            {
                $match: {
                    $and: [
                        { is_friend: { $lte: 0 } },
                        { check_friend_request: { $gt: 0 } }
                    ]
                }
            },
            { $sort: { _id: -1 } },
            { $skip: skip },
            { $limit: limit },
        ]);
        // console.log(list);
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
                                        { $eq: ["$from", "$$me"] },
                                        { $eq: ["$to", "$$other"] },
                                        // {
                                        //     $or: [
                                        //         {
                                        //             $and: [
                                        //                 { $eq: ["$from", "$$me"] },
                                        //                 { $eq: ["$to", "$$other"] }
                                        //             ]
                                        //         },
                                        //         {
                                        //             $and: [
                                        //                 { $eq: ["$from", "$$other"] },
                                        //                 { $eq: ["$to", "$$me"] }
                                        //             ]
                                        //         }
                                        //     ]
                                        // }
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
            {
                $match: {
                    $and: [
                        { is_friend: { $lte: 0 } },
                        { check_friend_request: { $gt: 0 } }
                    ]
                }
            },
            { $count: "total" }
        ]);
        totalpage = Math.ceil(total / limit);
        // const user_friend_model = new UsersFriendModel;
        // const user_friend_request_model = new UsersFriendRequestModel;
        let resetdata_is = await Promise.all(
            list.map(async (element) => {
                let uid = element._id.toString();
                // let totalfriend = await user_friend_model.IsFriend(user_id, uid);
                // let friend_request = await user_friend_request_model.checkFriendRequest(user_id, uid);
                let file_name = element.photo;
                let file_path = `${storageFolderPath()}users/${file_name}`;
                let file_view_path = `${APP_STORAGE}users/${file_name}`;
                let file_dtl = await FileInfo(file_name, file_path, file_view_path);
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

export async function NewFriendRequestList(req, resp) {
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
                                        { $eq: ["$from", "$$other"] },
                                        { $eq: ["$to", "$$me"] },
                                        // {
                                        //     $or: [
                                        //         {
                                        //             $and: [
                                        //                 { $eq: ["$from", "$$me"] },
                                        //                 { $eq: ["$to", "$$other"] }
                                        //             ]
                                        //         },
                                        //         {
                                        //             $and: [
                                        //                 { $eq: ["$from", "$$other"] },
                                        //                 { $eq: ["$to", "$$me"] }
                                        //             ]
                                        //         }
                                        //     ]
                                        // }
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
            {
                $match: {
                    $and: [
                        { is_friend: { $lte: 0 } },
                        { check_friend_request: { $gt: 0 } }
                    ]
                }
            },
            { $sort: { _id: -1 } },
            { $skip: skip },
            { $limit: limit },
        ]);
        // console.log(list);
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
                                        { $eq: ["$from", "$$other"] },
                                        { $eq: ["$to", "$$me"] },
                                        // {
                                        //     $or: [
                                        //         {
                                        //             $and: [
                                        //                 { $eq: ["$from", "$$me"] },
                                        //                 { $eq: ["$to", "$$other"] }
                                        //             ]
                                        //         },
                                        //         {
                                        //             $and: [
                                        //                 { $eq: ["$from", "$$other"] },
                                        //                 { $eq: ["$to", "$$me"] }
                                        //             ]
                                        //         }
                                        //     ]
                                        // }
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
            {
                $match: {
                    $and: [
                        { is_friend: { $lte: 0 } },
                        { check_friend_request: { $gt: 0 } }
                    ]
                }
            },
            { $count: "total" }
        ]);
        totalpage = Math.ceil(total / limit);
        // const user_friend_model = new UsersFriendModel;
        // const user_friend_request_model = new UsersFriendRequestModel;
        let resetdata_is = await Promise.all(
            list.map(async (element) => {
                let uid = element._id.toString();
                // let totalfriend = await user_friend_model.IsFriend(user_id, uid);
                // let friend_request = await user_friend_request_model.checkFriendRequest(user_id, uid);
                let file_name = element.photo;
                let file_path = `${storageFolderPath()}users/${file_name}`;
                let file_view_path = `${APP_STORAGE}users/${file_name}`;
                let file_dtl = await FileInfo(file_name, file_path, file_view_path);
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


export async function MyFriendsForShare(req, resp) {
    try {
        let { limit = 5, page = 1 } = req.query;
        let { name = '', user_id = '', blog_id = '' } = req.body;
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
            {
                $lookup: {
                    from: "users_chats",
                    let: { from_: "$_id", to_: new mongodb.ObjectId(user_id) },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$from_user", "$$from_"] },
                                        { $eq: ["$to_user", "$$to_"] },
                                        { $eq: ["$read_status", 0] },
                                        { $eq: ["$delete", 0] }
                                    ]
                                }
                            }
                        },
                    ],
                    as: "user_chats"
                }

            },
            {
                $addFields: {
                    total_unread_message: { $size: "$user_chats" }
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
                let file_path = `${storageFolderPath()}users/${file_name}`;
                let file_view_path = `${APP_STORAGE}users/${file_name}`;
                let file_dtl = await FileInfo(file_name, file_path, file_view_path);
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
                    "check_friend_request": element.check_friend_request,
                    "friend_request": element.check_friend_request > 0 ? element.friend_request[0] : null,
                    "wsstatus": element.wsstatus,
                    "total_unread_message": element.total_unread_message,
                }
            })
        );

        let data = {
            list: resetdata_is,
            total: total,
            lastpage: totalpage
        };

        let mytotal = await SharesModel
            .find({
                $and: [
                    { blog_id: new mongodb.ObjectId(blog_id) },
                    { user_id: new mongodb.ObjectId(user_id) },
                    { delete: 0 },
                ]
            })
            .countDocuments();

        let total_share = await SharesModel
            .find({
                $and: [
                    { blog_id: new mongodb.ObjectId(blog_id) },
                    { delete: 0 },
                ]
            })
            .countDocuments();


        return resp.status(200).json({ "status": 200, "message": "Success", 'result': data, 'mytotal': mytotal, 'total_share': total_share });
    } catch (error) {
        return resp.status(500).json({ "status": 500, "message": error.message, 'result': {} });
    }
}

