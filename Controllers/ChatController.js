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
                $project: {
                    from_user: 1,
                    to_user: 1,
                    message: 1,
                    chat_file: 1,
                    bookmark: 1,
                    sender: 1,
                    intid: 1,
                    created_at: 1,
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
                return {
                    ...element,
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

        let chat = await UsersChatModel.findOne({
            _id: new mongodb.ObjectId(chatid),
            delete: 0
        }).select({
            from_user: 1,
            to_user: 1,
            message: 1,
            chat_file: 1,
            bookmark: 1,
            sender: 1,
            created_at: 1,
        });
        let file_name = chat.chat_file;
        let file_path = `${Healper.storageFolderPath()}user-chats/${file_name}`;
        let file_view_path = `${APP_STORAGE}user-chats/${file_name}`;
        let file_dtl = await Healper.FileInfo(file_name, file_path, file_view_path);
        let rest_chat = { ...chat._doc, file_dtl: file_dtl };
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
            read_status: 0,
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

        let file_name1 = chat.chat_file;
        let file_path1 = `${Healper.storageFolderPath()}user-chats/${file_name1}`;
        let file_view_path1 = `${APP_STORAGE}user-chats/${file_name1}`;
        let file_dtl1 = await Healper.FileInfo(file_name1, file_path1, file_view_path1);
        let rest_chat = { ...chat._doc, file_dtl: file_dtl1 };



        let user_friends_model = new UsersFriendModel;
        let friends_list = await user_friends_model.getAllMyFriendByid(from_user);
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
            read_status: 0
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
            { $set: { read_status: 1 } },
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