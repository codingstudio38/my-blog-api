const mongodb = require('mongodb');
const moment = require('moment-timezone');
const mongoose = require('mongoose');
const UsersModel = require('../Models/UsersModel');
const UsersChatModel = require('../Models/UsersChatModel');
const UsersFriendModel = require('../Models/UsersFriendModel');
const AllNotificationsModel = require('../Models/AllNotificationsModel');
const { clients } = require("./WebsocketController");
const Healper = require('./Healper');
const bcrypt = require("bcrypt");
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const APP_URL = process.env.APP_URL;
const APP_STORAGE = process.env.APP_STORAGE;
const new_chat_message = process.env.new_chat_message;
async function UploadChatFile(req, resp) {
    try {
        let { userid = '' } = req.body;
        let fileIs = '', file_size = 0, file_name = '', file_type = '', file_new_name = '', file_mimetype = '', blog_file_path = '';
        blog_file_path = `${Healper.storageFolderPath()}user-chats/temp/user${userid}`;
        if (!userid) {
            return resp.status(200).json({ 'status': 400, 'message': 'user id required.' });
        }
        if (!req.files) {
            return resp.status(200).json({ "status": 200, "message": "file not found!", "data": result });
        }
        if (!fs.existsSync(blog_file_path)) {
            fs.mkdirSync(blog_file_path, { recursive: true });
        }
        fileIs = req.files.photo;
        file_size = fileIs.size;
        file_name = fileIs.name;
        const file_n = file_name.split(".");
        file_type = file_n[file_n.length - 1];
        file_mimetype = fileIs.mimetype;
        file_new_name = `${crypto.randomBytes(8).toString('hex')}.${file_type}`;
        await fileIs.mv(`${blog_file_path}/${file_new_name}`);
        const user = await UsersModel.findOne({ _id: new mongodb.ObjectId(userid) });
        if (user == null) {
            return resp.status(200).json({ "status": 400, "message": "user not found!" });
        }
        const result = { "status": 200, "message": "Success", 'result': `${APP_STORAGE}user-chats/temp/user${userid}/${file_new_name}`, 'file_name': file_new_name }
        return resp.status(200).json(result);
    } catch (error) {
        return resp.status(500).json({ "status": 500, "message": error.message, 'result': {} });
    }
}

async function ChatList(req, resp) {
    try {
        var { page = 1, limit = 10, start = 0 } = req.query;
        var { from_user, to_user } = req.body;
        page = parseInt(page);
        limit = parseInt(limit);
        start = (page - 1) * limit;
        // console.log(page, limit, start);
        if (!from_user) {
            return resp
                .status(200)
                .json({ status: 400, message: "from_user id required" });
        }
        if (from_user.length !== 24) {
            return resp
                .status(200)
                .json({
                    status: 400,
                    message: "Invalid from_user. from_user id must be 24 characters.",
                });
        }
        if (!to_user) {
            return resp
                .status(200)
                .json({ status: 400, message: "to_user id required" });
        }
        if (to_user.length !== 24) {
            return resp
                .status(200)
                .json({
                    status: 400,
                    message: "Invalid to_user. to_user id must be 24 characters.",
                });
        }

        let total = await UsersChatModel.find({
            $and: [
                { delete: 0 },
                { from_user: new mongodb.ObjectId(from_user) },
                { to_user: new mongodb.ObjectId(to_user) },
            ],
        }).countDocuments();

        let total_records = await UsersChatModel.find({
            delete: 0,
            $or: [
                {
                    $and: [
                        { from_user: new mongodb.ObjectId(from_user) },
                        { to_user: new mongodb.ObjectId(to_user) },
                    ],
                },
                {
                    $and: [
                        { from_user: new mongodb.ObjectId(to_user) },
                        { to_user: new mongodb.ObjectId(from_user) },
                    ],
                },
            ],
        }).countDocuments();

        let chat_data = await UsersChatModel.aggregate([
            {
                $match: {
                    delete: 0,
                    $or: [
                        {
                            $and: [
                                { from_user: new mongodb.ObjectId(from_user) },
                                { to_user: new mongodb.ObjectId(to_user) },
                            ],
                        },
                        {
                            $and: [
                                { from_user: new mongodb.ObjectId(to_user) },
                                { to_user: new mongodb.ObjectId(from_user) },
                            ],
                        },
                    ],
                },
            },
            {
                $addFields: {
                    info_obj_id: {
                        $cond: {
                            if: {
                                $or: [
                                    { $eq: ["$info", ""] },
                                    { $eq: ["$info", null] },
                                    { $eq: ["$info", '0'] },
                                    { $eq: [{ $type: "$info" }, "missing"] }
                                ]
                            },
                            then: '',
                            else: {
                                $toObjectId: "$info"
                            }
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: "blogs",
                    localField: "info_obj_id",
                    foreignField: "_id",
                    as: "blogs_detail"
                }
            },
            { $unwind: { path: "$blogs_detail", preserveNullAndEmptyArrays: true } },
            {
                $addFields: {
                    shared_blog_obj_id: {
                        $convert: {
                            input: "$blogs_detail.shared_blog_id",
                            to: "objectId",
                            onError: null,
                            onNull: null
                        }
                        // $cond: {
                        //     if: {
                        //         $or: [
                        //             { $eq: ["blogs_detail.shared_blog_id", ""] },
                        //             { $eq: ["blogs_detail.shared_blog_id", null] },
                        //             { $eq: ["blogs_detail.shared_blog_id", '0'] },
                        //             { $eq: [{ $type: "blogs_detail.shared_blog_id" }, "missing"] }
                        //         ]
                        //     },
                        //     then: '',
                        //     else: {
                        //         $toObjectId: "$blogs_detail.shared_blog_id"
                        //     }
                        // }
                    }
                }
            },
            {
                $lookup: {
                    from: "blogs",
                    localField: "shared_blog_obj_id",
                    foreignField: "_id",
                    as: "main_blog_detail"
                }
            },
            { $unwind: { path: "$main_blog_detail", preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    from_user: 1,
                    to_user: 1,
                    message: 1,
                    chat_file: 1,
                    bookmark: 1,
                    sender: 1,
                    intid: 1,
                    created_at: 1,
                    chat_type: 1,
                    info: 1,
                    'blog_title': '$blogs_detail.title',
                    'blog_type': '$blogs_detail.blog_type',
                    'blog_photo': '$blogs_detail.photo',
                    'blog_thumbnail': '$blogs_detail.thumbnail',
                    'blog_id': '$blogs_detail._id',
                    'blog_alias': '$blogs_detail.content_alias',
                    'is_shared_blog': '$blogs_detail.is_shared_blog',

                    'main_blog_title': '$main_blog_detail.title',
                    'main_blog_type': '$main_blog_detail.blog_type',
                    'main_blog_photo': '$main_blog_detail.photo',
                    'main_blog_thumbnail': '$main_blog_detail.thumbnail',
                    'main_blog_id': '$main_blog_detail._id',
                    'main_blog_alias': '$main_blog_detail.content_alias',
                    'main_is_shared_blog': '$main_blog_detail.is_shared_blog',
                },
            },
            { $sort: { intid: -1 } },
            { $skip: start },
            { $limit: limit },

        ]);
        let resetdata_is = await Promise.all(
            chat_data.map(async (element) => {
                let file_name = element.chat_file;
                let file_path = `${Healper.storageFolderPath()}user-chats/${file_name}`;
                let file_view_path = `${APP_STORAGE}user-chats/${file_name}`;
                let file_dtl = await Healper.FileInfo(file_name, file_path, file_view_path);

                let file_name1 = element.blog_photo;
                let file_path1 = `${Healper.storageFolderPath()}user-blogs/${file_name1}`;
                let file_view_path1 = `${APP_STORAGE}user-blogs/${file_name1}`;
                let file_dtl1 = await Healper.FileInfo(file_name1, file_path1, file_view_path1);

                let file_name2 = element.blog_thumbnail;
                let file_path2 = `${Healper.storageFolderPath()}user-blogs/thumbnail/${file_name2}`;
                let file_view_path2 = `${APP_STORAGE}user-blogs/thumbnail/${file_name2}`;
                let file_dtl2 = await Healper.FileInfo(file_name2, file_path2, file_view_path2);

                let file_name3 = element.main_blog_photo;
                let file_path3 = `${Healper.storageFolderPath()}user-blogs/${file_name3}`;
                let file_view_path3 = `${APP_STORAGE}user-blogs/${file_name3}`;
                let file_dtl3 = await Healper.FileInfo(file_name3, file_path3, file_view_path3);

                let file_name4 = element.main_blog_thumbnail;
                let file_path4 = `${Healper.storageFolderPath()}user-blogs/thumbnail/${file_name4}`;
                let file_view_path4 = `${APP_STORAGE}user-blogs/thumbnail/${file_name4}`;
                let file_dtl4 = await Healper.FileInfo(file_name4, file_path4, file_view_path4);

                return {
                    ...element,
                    "main_blog_title": element.main_blog_title === undefined ? '' : element.main_blog_title,
                    "main_blog_type": element.main_blog_type === undefined ? '' : element.main_blog_type,
                    "main_blog_photo": element.main_blog_photo === undefined ? '' : element.main_blog_photo,
                    "main_blog_thumbnail": element.main_blog_thumbnail === undefined ? '' : element.main_blog_thumbnail,
                    "main_blog_id": element.main_blog_id === undefined ? '' : element.main_blog_id,
                    "main_blog_alias": element.main_blog_alias === undefined ? '' : element.main_blog_alias,
                    "main_is_shared_blog": element.main_is_shared_blog === undefined ? false : element.main_is_shared_blog,
                    "main_blog_photo_dtl": file_dtl3,
                    "main_blog_thumbnail_dtl": file_dtl4,

                    "blog_title": element.blog_title === undefined ? '' : element.blog_title,
                    "blog_type": element.blog_type === undefined ? '' : element.blog_type,
                    "blog_photo": element.blog_photo === undefined ? '' : element.blog_photo,
                    "blog_thumbnail": element.blog_thumbnail === undefined ? '' : element.blog_thumbnail,
                    "blog_id": element.blog_id === undefined ? '' : element.blog_id,
                    "blog_alias": element.blog_alias === undefined ? '' : element.blog_alias,
                    "is_shared_blog": element.is_shared_blog === undefined ? false : element.is_shared_blog,
                    "blog_photo_dtl": file_dtl1,
                    "blog_thumbnail_dtl": file_dtl2,

                    "chat_type": element.chat_type === undefined ? '0' : element.chat_type,
                    "info": element.info === undefined ? '0' : element.info,
                    "created_at": moment(element.created_at).format('YYYY-MM-DD HH:mm:ss'),
                    "updated_at": element.updated_at == null ? null : moment(element.updated_at).format('YYYY-MM-DD HH:mm:ss'),
                    "file_dtl": file_dtl,
                }
            })
        );
        let alldata = resetdata_is.sort((a, b) => a.intid - b.intid);
        let pagination = Healper.PaginationData(alldata, total_records, limit, page);
        return resp
            .status(200)
            .json({
                status: 200,
                message: "Success",
                total: total,
                pagination: pagination,
            });
    } catch (error) {
        return resp
            .status(500)
            .json({ status: 500, message: "Failed..!!", error: error.message });
    }
}

async function FindChat(req, resp) {
    try {
        var { chatid, from_user, to_user } = req.body;
        if (!chatid) {
            return resp
                .status(200)
                .json({ status: 400, message: "chat id required" });
        }
        if (chatid.length !== 24) {
            return resp
                .status(200)
                .json({
                    status: 400,
                    message: "Invalid Id. id must be 24 characters.",
                });
        }
        let chat = new UsersChatModel;
        chat = await chat.findBChatId(chatid);
        chat = chat.length > 0 ? chat[0] : {};
        let file_name = chat.chat_file;
        let file_path = `${Healper.storageFolderPath()}user-chats/${file_name}`;
        let file_view_path = `${APP_STORAGE}user-chats/${file_name}`;
        let file_dtl = await Healper.FileInfo(file_name, file_path, file_view_path);

        let file_name1 = chat.blog_photo;
        let file_path1 = `${Healper.storageFolderPath()}user-blogs/${file_name1}`;
        let file_view_path1 = `${APP_STORAGE}user-blogs/${file_name1}`;
        let file_dtl1 = await Healper.FileInfo(file_name1, file_path1, file_view_path1);

        let file_name2 = chat.blog_thumbnail;
        let file_path2 = `${Healper.storageFolderPath()}user-blogs/thumbnail/${file_name2}`;
        let file_view_path2 = `${APP_STORAGE}user-blogs/thumbnail/${file_name2}`;
        let file_dtl2 = await Healper.FileInfo(file_name2, file_path2, file_view_path2);

        let file_name3 = chat.main_blog_photo;
        let file_path3 = `${Healper.storageFolderPath()}user-blogs/${file_name3}`;
        let file_view_path3 = `${APP_STORAGE}user-blogs/${file_name3}`;
        let file_dtl3 = await Healper.FileInfo(file_name3, file_path3, file_view_path3);

        let file_name4 = chat.main_blog_thumbnail;
        let file_path4 = `${Healper.storageFolderPath()}user-blogs/thumbnail/${file_name4}`;
        let file_view_path4 = `${APP_STORAGE}user-blogs/thumbnail/${file_name4}`;
        let file_dtl4 = await Healper.FileInfo(file_name4, file_path4, file_view_path4);

        let rest_chat = {
            ...chat,
            "main_blog_title": chat.main_blog_title === undefined ? '' : chat.main_blog_title,
            "main_blog_type": chat.main_blog_type === undefined ? '' : chat.main_blog_type,
            "main_blog_photo": chat.main_blog_photo === undefined ? '' : chat.main_blog_photo,
            "main_blog_thumbnail": chat.main_blog_thumbnail === undefined ? '' : chat.main_blog_thumbnail,
            "main_blog_id": chat.main_blog_id === undefined ? '' : chat.main_blog_id,
            "main_blog_alias": chat.main_blog_alias === undefined ? '' : chat.main_blog_alias,
            "main_is_shared_blog": chat.main_is_shared_blog === undefined ? false : chat.main_is_shared_blog,
            "main_blog_photo_dtl": file_dtl3,
            "main_blog_thumbnail_dtl": file_dtl4,

            "blog_title": chat.blog_title === undefined ? '' : chat.blog_title,
            "blog_type": chat.blog_type === undefined ? '' : chat.blog_type,
            "blog_photo": chat.blog_photo === undefined ? '' : chat.blog_photo,
            "blog_thumbnail": chat.blog_thumbnail === undefined ? '' : chat.blog_thumbnail,
            "blog_id": chat.blog_id === undefined ? '' : chat.blog_id,
            "blog_alias": chat.blog_alias === undefined ? '' : chat.blog_alias,
            "is_shared_blog": chat.is_shared_blog === undefined ? false : chat.is_shared_blog,
            "blog_photo_dtl": file_dtl1,
            "blog_thumbnail_dtl": file_dtl2,

            "chat_type": chat.chat_type === undefined ? '0' : chat.chat_type,
            "info": chat.info === undefined ? '0' : chat.info,
            file_dtl: file_dtl,
            "created_at": moment(chat.created_at).format('YYYY-MM-DD HH:mm:ss'),
            "updated_at": chat.updated_at == null ? null : moment(chat.updated_at).format('YYYY-MM-DD HH:mm:ss'),
        };
        let total = await UsersChatModel.find({
            $and: [
                { from_user: new mongodb.ObjectId(from_user) },
                { to_user: new mongodb.ObjectId(to_user) },
                { delete: 0 }
            ],
        }).countDocuments();
        return resp
            .status(200)
            .json({ status: 200, message: "Success", chat: rest_chat, total: total });
    } catch (error) {
        return resp
            .status(500)
            .json({ status: 500, message: "Failed..!!", error: error.message });
    }
}


async function SaveChat(req, resp) {
    try {
        var { from_user, to_user, message, file_name } = req.body;
        let file_path = `${Healper.storageFolderPath()}user-chats/temp/user${from_user}/${file_name}`,
            new_file_path = `${Healper.storageFolderPath()}user-chats/${file_name}`;
        if (!from_user) {
            return resp
                .status(200)
                .json({ status: 400, message: "from_user required." });
        }
        if (!to_user) {
            return resp
                .status(200)
                .json({ status: 400, message: "to_user required." });
        }

        let intid = await UsersChatModel.find({ delete: 0 }).countDocuments();
        intid = intid + 1;

        let NewChat = new UsersChatModel({
            from_user: from_user,
            to_user: to_user,
            message: message,
            sender: from_user,
            intid: intid,
            bookmark: false,
            chat_type: '0',
            info: '0',
            read_status: 0,
            created_at: moment().tz(process.env.TIMEZONE).format('YYYY-MM-DD HH:mm:ss'),
        });
        if (file_name !== '') {
            if (!fs.existsSync(`${new_file_path}`)) {
                if (!fs.existsSync(`${file_path}`)) {
                    return resp.status(200).json({ 'status': 400, 'message': 'file not found required.' });
                }
                await fs.rename(file_path, new_file_path, (err) => {
                    if (err) {
                        return resp.status(200).json({ 'status': 400, 'message': 'Error moving file' });
                    }
                })
            }
            NewChat['chat_file'] = file_name;
        }
        let chat = await NewChat.save();


        let findchat = new UsersChatModel;
        findchat = await findchat.findBChatId(chat._doc._id);
        findchat = findchat.length > 0 ? findchat[0] : {};
        let file_name11 = chat.chat_file;
        let file_path11 = `${Healper.storageFolderPath()}user-chats/${file_name11}`;
        let file_view_path11 = `${APP_STORAGE}user-chats/${file_name11}`;
        let file_dtl11 = await Healper.FileInfo(file_name11, file_path11, file_view_path11);

        let file_name1 = chat.blog_photo;
        let file_path1 = `${Healper.storageFolderPath()}user-blogs/${file_name1}`;
        let file_view_path1 = `${APP_STORAGE}user-blogs/${file_name1}`;
        let file_dtl1 = await Healper.FileInfo(file_name1, file_path1, file_view_path1);

        let file_name2 = chat.blog_thumbnail;
        let file_path2 = `${Healper.storageFolderPath()}user-blogs/thumbnail/${file_name2}`;
        let file_view_path2 = `${APP_STORAGE}user-blogs/thumbnail/${file_name2}`;
        let file_dtl2 = await Healper.FileInfo(file_name2, file_path2, file_view_path2);

        let file_name3 = chat.main_blog_photo;
        let file_path3 = `${Healper.storageFolderPath()}user-blogs/${file_name3}`;
        let file_view_path3 = `${APP_STORAGE}user-blogs/${file_name3}`;
        let file_dtl3 = await Healper.FileInfo(file_name3, file_path3, file_view_path3);

        let file_name4 = chat.main_blog_thumbnail;
        let file_path4 = `${Healper.storageFolderPath()}user-blogs/thumbnail/${file_name4}`;
        let file_view_path4 = `${APP_STORAGE}user-blogs/thumbnail/${file_name4}`;
        let file_dtl4 = await Healper.FileInfo(file_name4, file_path4, file_view_path4);

        let rest_chat = {
            ...findchat,
            "main_blog_title": findchat.main_blog_title === undefined ? '' : findchat.main_blog_title,
            "main_blog_type": findchat.main_blog_type === undefined ? '' : findchat.main_blog_type,
            "main_blog_photo": findchat.main_blog_photo === undefined ? '' : findchat.main_blog_photo,
            "main_blog_thumbnail": findchat.main_blog_thumbnail === undefined ? '' : findchat.main_blog_thumbnail,
            "main_blog_id": findchat.main_blog_id === undefined ? '' : findchat.main_blog_id,
            "main_blog_alias": findchat.main_blog_alias === undefined ? '' : findchat.main_blog_alias,
            "main_is_shared_blog": findchat.main_is_shared_blog === undefined ? false : findchat.main_is_shared_blog,
            "main_blog_photo_dtl": file_dtl3,
            "main_blog_thumbnail_dtl": file_dtl4,

            "blog_title": findchat.blog_title === undefined ? '' : findchat.blog_title,
            "blog_type": findchat.blog_type === undefined ? '' : findchat.blog_type,
            "blog_photo": findchat.blog_photo === undefined ? '' : findchat.blog_photo,
            "blog_thumbnail": findchat.blog_thumbnail === undefined ? '' : findchat.blog_thumbnail,
            "blog_id": findchat.blog_id === undefined ? '' : findchat.blog_id,
            "blog_alias": findchat.blog_alias === undefined ? '' : findchat.blog_alias,
            "is_shared_blog": findchat.is_shared_blog === undefined ? false : findchat.is_shared_blog,
            "blog_photo_dtl": file_dtl1,
            "blog_thumbnail_dtl": file_dtl2,

            "chat_type": findchat.chat_type === undefined ? '0' : findchat.chat_type,
            "info": findchat.info === undefined ? '0' : findchat.info,
            file_dtl: file_dtl11,
            "created_at": moment(findchat.created_at).format('YYYY-MM-DD HH:mm:ss'),
            "updated_at": findchat.updated_at == null ? null : moment(findchat.updated_at).format('YYYY-MM-DD HH:mm:ss'),
        };


        let user_friends_model = new UsersFriendModel;
        let friends_list = await user_friends_model.MyFriend(from_user, to_user);
        let notify_ = {
            notify_toid: to_user,
            userid: from_user,
            requestid: friends_list[0].requestid,
            from: from_user,
            to: to_user,
            accept_status: 0,
            from_user_name: friends_list[0].from_user_name,
            from_user_photo: friends_list[0].from_user_photo,
            to_user_name: friends_list[0].to_user_name,
            to_user_photo: friends_list[0].to_user_photo,
            category: new_chat_message,
            remove_byid: '',
            blog_id: rest_chat._id,
            text: message,
            read_status: 0,
            created_at: moment().tz(process.env.TIMEZONE).format('YYYY-MM-DD HH:mm:ss'),
        };

        let notification = new AllNotificationsModel(notify_);
        notification = await notification.save();

        let noti_file_name = friends_list[0].from_user_photo;
        let noti_file_path = `${Healper.storageFolderPath()}users/${noti_file_name}`;
        let noti_file_view_path = `${APP_STORAGE}users/${noti_file_name}`;
        let noti_file_dtl = await Healper.FileInfo(noti_file_name, noti_file_path, noti_file_view_path);

        let noti_to_file_name = friends_list[0].to_user_photo;
        let noti_to_file_path = `${Healper.storageFolderPath()}users/${noti_to_file_name}`;
        let noti_to_file_view_path = `${APP_STORAGE}users/${noti_to_file_name}`;
        let noti_to_file_dtl = await Healper.FileInfo(noti_to_file_name, noti_to_file_path, noti_to_file_view_path);

        let rest_notification = {
            ...notification._doc,
            to_user_file_view_path: noti_to_file_dtl.file_view_path,
            from_user_file_view_path: noti_file_dtl.file_view_path,
            created_at: moment(notification.created_at).format('YYYY-MM-DD HH:mm:ss'),
        }

        if (clients[to_user]) {
            let data = { "code": new_chat_message, "message": "new chat message", 'result': rest_notification, chat: rest_chat }
            clients[to_user].sendUTF(JSON.stringify(data));
        }
        return resp
            .status(200)
            .json({
                status: 200,
                message: "Message has been successfully sended.",
                result: rest_chat,
            });
    } catch (error) {
        return resp
            .status(500)
            .json({ status: 500, message: "Failed..!!.", error: error.message });
    }
}

async function UpdateUnreadMessage(req, resp) {
    try {
        let { from, to } = req.body;

        let updateis = await UsersChatModel.updateMany(
            { $and: [{ from_user: new mongodb.ObjectId(from) }, { to_user: new mongodb.ObjectId(to) }] },
            { $set: { read_status: 1, updated_at: moment().tz(process.env.TIMEZONE).format('YYYY-MM-DD HH:mm:ss') } },
            { returnDocument: "after" }
        ); // returnDocument: 'after', new: true, useFindAndModify: false, returnOriginal: false,
        return resp
            .status(200)
            .json({ status: 200, message: "Success", data: updateis });
    } catch (error) {
        return resp
            .status(400)
            .json({ status: 400, message: "Failed..!!", error: error.message });
    }
}

module.exports = { UploadChatFile, ChatList, FindChat, SaveChat, UpdateUnreadMessage }