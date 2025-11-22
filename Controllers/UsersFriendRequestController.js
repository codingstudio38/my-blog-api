const mongodb = require('mongodb');
const moment = require('moment-timezone');
const mongoose = require('mongoose');
const UsersFriendRequestModel = require('../Models/UsersFriendRequestModel');
const UsersFriendModel = require('../Models/UsersFriendModel');
const AllNotificationsModel = require('../Models/AllNotificationsModel');
const Healper = require('./Healper');
const { WebsocketController, clients } = require("./WebsocketController");
const new_friend_request = process.env.new_friend_request;
const cencel_friend_request = process.env.cencel_friend_request;
const accept_friend_request = process.env.accept_friend_request;
const reject_friend_request = process.env.reject_friend_request;
const remove_friend = process.env.remove_friend;
const APP_STORAGE = process.env.APP_STORAGE;
async function SendRequest(req, resp) {
    try {
        let { user_id = '', to = '' } = req.body;
        if (!user_id) {
            return resp.status(200).json({ 'status': 400, 'message': 'user id required.' });
        }
        from = user_id;
        if (!to) {
            return resp.status(200).json({ 'status': 400, 'message': 'to id required.' });
        }

        let user_friend_request_model = new UsersFriendRequestModel;
        let friend_request = await user_friend_request_model.checkFriendRequest(from, to);
        if (friend_request.length > 0) {
            const r = friend_request[0];
            if (r.accept_status == 1) {
                return resp.status(200).json({ "status": 300, "message": "already friend", 'result': friend_request, 'friend_request': friend_request });
            } else {
                let msg = "already request send";
                if (r.from !== from) {
                    msg = "already get the request from user.";
                }
                return resp.status(200).json({ "status": 600, "message": msg, 'result': friend_request, 'friend_request': friend_request });
            }
        }
        let NewRequest = new UsersFriendRequestModel({
            from: from,
            to: to,
            accept_status: 0,
        });
        NewRequest = await NewRequest.save();
        user_friend_request_model = new UsersFriendRequestModel;
        friend_request = await user_friend_request_model.checkFriendRequest(from, to);
        let notification = new AllNotificationsModel({
            notify_toid: to,
            userid: user_id,
            requestid: NewRequest._id,
            from: friend_request[0].from,
            to: friend_request[0].to,
            accept_status: 0,
            from_user_name: friend_request[0].from_user_name,
            from_user_photo: friend_request[0].from_user_photo,
            to_user_name: friend_request[0].to_user_name,
            to_user_photo: friend_request[0].to_user_photo,
            category: new_friend_request,
            remove_byid: '',
            text: `${friend_request[0].from_user_name} send to you friend request.`,
            read_status: 0
        });
        notification = await notification.save();
        let file_name = friend_request[0].from_user_photo;
        let file_path = `${Healper.storageFolderPath()}users/${file_name}`;
        let file_view_path = `${APP_STORAGE}users/${file_name}`;
        let file_dtl = await Healper.FileInfo(file_name, file_path, file_view_path);

        let to_file_name = friend_request[0].to_user_photo;
        let to_file_path = `${Healper.storageFolderPath()}users/${to_file_name}`;
        let to_file_view_path = `${APP_STORAGE}users/${to_file_name}`;
        let to_file_dtl = await Healper.FileInfo(to_file_name, to_file_path, to_file_view_path);

        let reset_notification = {
            _id: notification._id,
            userid: notification.userid,
            requestid: notification.requestid,
            from: notification.from,
            to: notification.to,
            accept_status: notification.accept_status,
            from_user_name: notification.from_user_name,
            from_user_photo: notification.from_user_photo,
            to_user_name: notification.to_user_name,
            to_user_photo: notification.to_user_photo,
            category: notification.category,
            text: notification.text,
            read_status: notification.read_status,
            to_user_file_view_path: to_file_dtl.file_view_path,
            from_user_file_view_path: file_dtl.file_view_path,
            remove_byid: notification.remove_byid,
            notify_toid: notification.notify_toid,
            created_at: moment(notification.created_at).format('YYYY-MM-DD HH:mm:ss'),
        };
        if (clients[to]) {
            let data = { "code": new_friend_request, "message": "new friend request", 'result': reset_notification }
            clients[to].sendUTF(JSON.stringify(data));
        }
        return resp.status(200).json({ "status": 200, "message": "Success", 'result': NewRequest, 'friend_request': friend_request });
    } catch (error) {
        return resp.status(500).json({ "status": 500, "message": error.message, 'result': {} });
    }
}

async function CencelRequest(req, resp) {
    try {
        let { user_id = '', to = '', requestid = '' } = req.body;
        if (!user_id) {
            return resp.status(200).json({ 'status': 400, 'message': 'user id required.' });
        }
        if (!to) {
            return resp.status(200).json({ 'status': 400, 'message': 'to id required.' });
        }
        from = user_id;
        const check_user_accept_satus = await UsersFriendModel.find({
            $and: [
                { 'requestid': new mongodb.ObjectId(requestid) },
                { 'delete': 0 }
            ]
        }).countDocuments();

        if (check_user_accept_satus <= 0) {
            let user_friend_request_model = new UsersFriendRequestModel;
            let friend_request = await user_friend_request_model.checkFriendRequest(from, to);
            let delete_friend = await UsersFriendModel.deleteMany({
                $and: [
                    { 'requestid': new mongodb.ObjectId(requestid) },
                ]
            });
            let delete_request = await UsersFriendRequestModel.deleteMany({
                $and: [
                    { '_id': new mongodb.ObjectId(requestid) },
                ]
            });
            let notification = new AllNotificationsModel({
                notify_toid: to,
                userid: user_id,
                requestid: requestid,
                from: friend_request[0].from,
                to: friend_request[0].to,
                accept_status: 0,
                from_user_name: friend_request[0].from_user_name,
                from_user_photo: friend_request[0].from_user_photo,
                to_user_name: friend_request[0].to_user_name,
                to_user_photo: friend_request[0].to_user_photo,
                category: cencel_friend_request,
                remove_byid: '',
                text: `${friend_request[0].from_user_name} cencel friend request.`,
                read_status: 0
            });
            notification = await notification.save();
            let file_name = friend_request[0].from_user_photo;
            let file_path = `${Healper.storageFolderPath()}users/${file_name}`;
            let file_view_path = `${APP_STORAGE}users/${file_name}`;
            let file_dtl = await Healper.FileInfo(file_name, file_path, file_view_path);

            let to_file_name = friend_request[0].to_user_photo;
            let to_file_path = `${Healper.storageFolderPath()}users/${to_file_name}`;
            let to_file_view_path = `${APP_STORAGE}users/${to_file_name}`;
            let to_file_dtl = await Healper.FileInfo(to_file_name, to_file_path, to_file_view_path);

            let reset_notification = {
                _id: notification._id,
                userid: notification.userid,
                requestid: notification.requestid,
                from: notification.from,
                to: notification.to,
                accept_status: notification.accept_status,
                from_user_name: notification.from_user_name,
                from_user_photo: notification.from_user_photo,
                to_user_name: notification.to_user_name,
                to_user_photo: notification.to_user_photo,
                category: notification.category,
                text: notification.text,
                read_status: notification.read_status,
                to_user_file_view_path: to_file_dtl.file_view_path,
                from_user_file_view_path: file_dtl.file_view_path,
                remove_byid: notification.remove_byid,
                notify_toid: notification.notify_toid,
                created_at: moment(notification.created_at).format('YYYY-MM-DD HH:mm:ss'),
            };
            if (clients[to]) {
                let data = { "code": cencel_friend_request, "message": "cencel friend request", 'result': reset_notification }
                clients[to].sendUTF(JSON.stringify(data));
            }
            return resp.status(200).json({ "status": 200, "message": "Success", 'result': delete_request, 'delete_friend': delete_friend });
        } else {
            return resp.status(200).json({ "status": 300, "message": "you are already friend", 'result': check_user_accept_satus });
        }
    } catch (error) {
        return resp.status(500).json({ "status": 500, "message": error.message, 'result': {} });
    }
}

async function AcceptOrRejectRequest(req, resp) {
    try {
        let { user_id = '', from = '', to = '', requestid = '', accept_status = 0 } = req.body;
        if (!user_id) {
            return resp.status(200).json({ 'status': 400, 'message': 'user id required.' });
        }
        if (!from) {
            return resp.status(200).json({ 'status': 400, 'message': 'from id required.' });
        }
        if (!to) {
            return resp.status(200).json({ 'status': 400, 'message': 'to id required.' });
        }
        if (!requestid) {
            return resp.status(200).json({ 'status': 400, 'message': 'request id required.' });
        }
        if (!accept_status) {
            return resp.status(200).json({ 'status': 400, 'message': 'accept status required.' });
        }
        const check_user_request_status = await UsersFriendRequestModel.find({
            $and: [
                { _id: new mongodb.ObjectId(requestid) },
                { 'delete': 0 }
            ]
        }).countDocuments();
        if (check_user_request_status > 0) {
            let user_friend_request_model = new UsersFriendRequestModel;
            let friend_request = await user_friend_request_model.checkFriendRequest(from, to);

            if (accept_status == 1) {//accept
                let save_friends = await UsersFriendModel.insertMany([
                    { requestid: requestid, userid: from, friend: to, delete: 0 },
                    { requestid: requestid, userid: to, friend: from, delete: 0 }
                ]);
                let update_request = await UsersFriendRequestModel.updateOne({ _id: new mongodb.ObjectId(requestid) }, { $set: { accept_status: 1 } });
                let notification = new AllNotificationsModel({
                    notify_toid: friend_request[0].from,
                    userid: user_id,
                    requestid: requestid,
                    from: friend_request[0].from,
                    to: friend_request[0].to,
                    accept_status: 0,
                    from_user_name: friend_request[0].from_user_name,
                    from_user_photo: friend_request[0].from_user_photo,
                    to_user_name: friend_request[0].to_user_name,
                    to_user_photo: friend_request[0].to_user_photo,
                    category: accept_friend_request,
                    remove_byid: '',
                    text: `friend request accepted by ${friend_request[0].to_user_name}.`,
                    read_status: 0
                });
                notification = await notification.save();
                let file_name = friend_request[0].from_user_photo;
                let file_path = `${Healper.storageFolderPath()}users/${file_name}`;
                let file_view_path = `${APP_STORAGE}users/${file_name}`;
                let file_dtl = await Healper.FileInfo(file_name, file_path, file_view_path);
                let to_file_name = friend_request[0].to_user_photo;
                let to_file_path = `${Healper.storageFolderPath()}users/${to_file_name}`;
                let to_file_view_path = `${APP_STORAGE}users/${to_file_name}`;
                let to_file_dtl = await Healper.FileInfo(to_file_name, to_file_path, to_file_view_path);
                let reset_notification = {
                    _id: notification._id,
                    userid: notification.userid,
                    requestid: notification.requestid,
                    from: notification.from,
                    to: notification.to,
                    accept_status: notification.accept_status,
                    from_user_name: notification.from_user_name,
                    from_user_photo: notification.from_user_photo,
                    to_user_name: notification.to_user_name,
                    to_user_photo: notification.to_user_photo,
                    category: notification.category,
                    text: notification.text,
                    read_status: notification.read_status,
                    to_user_file_view_path: to_file_dtl.file_view_path,
                    from_user_file_view_path: file_dtl.file_view_path,
                    remove_byid: notification.remove_byid,
                    notify_toid: notification.notify_toid,
                    created_at: moment(notification.created_at).format('YYYY-MM-DD HH:mm:ss'),
                };
                if (clients[friend_request[0].from]) {
                    let data = { "code": accept_friend_request, "message": "friend request accepted", 'result': reset_notification }
                    clients[friend_request[0].from].sendUTF(JSON.stringify(data));
                }
                return resp.status(200).json({ "status": 200, "message": "Success", 'result': save_friends, 'update_request': update_request });
            } else {//reject
                let notification = new AllNotificationsModel({
                    notify_toid: friend_request[0].from,
                    userid: user_id,
                    requestid: requestid,
                    from: friend_request[0].from,
                    to: friend_request[0].to,
                    accept_status: 0,
                    from_user_name: friend_request[0].from_user_name,
                    from_user_photo: friend_request[0].from_user_photo,
                    to_user_name: friend_request[0].to_user_name,
                    to_user_photo: friend_request[0].to_user_photo,
                    category: reject_friend_request,
                    remove_byid: '',
                    text: `friend request rejected by ${friend_request[0].from_user_name}.`,
                    read_status: 0
                });
                notification = await notification.save();
                let file_name = friend_request[0].from_user_photo;
                let file_path = `${Healper.storageFolderPath()}users/${file_name}`;
                let file_view_path = `${APP_STORAGE}users/${file_name}`;
                let file_dtl = await Healper.FileInfo(file_name, file_path, file_view_path);
                let to_file_name = friend_request[0].to_user_photo;
                let to_file_path = `${Healper.storageFolderPath()}users/${to_file_name}`;
                let to_file_view_path = `${APP_STORAGE}users/${to_file_name}`;
                let to_file_dtl = await Healper.FileInfo(to_file_name, to_file_path, to_file_view_path);
                let reset_notification = {
                    _id: notification._id,
                    userid: notification.userid,
                    requestid: notification.requestid,
                    from: notification.from,
                    to: notification.to,
                    accept_status: notification.accept_status,
                    from_user_name: notification.from_user_name,
                    from_user_photo: notification.from_user_photo,
                    to_user_name: notification.to_user_name,
                    to_user_photo: notification.to_user_photo,
                    category: notification.category,
                    text: notification.text,
                    read_status: notification.read_status,
                    to_user_file_view_path: to_file_dtl.file_view_path,
                    from_user_file_view_path: file_dtl.file_view_path,
                    remove_byid: notification.remove_byid,
                    notify_toid: notification.notify_toid,
                    created_at: moment(notification.created_at).format('YYYY-MM-DD HH:mm:ss'),
                };
                if (clients[friend_request[0].from]) {
                    let data = { "code": reject_friend_request, "message": "friend request rejected", 'result': reset_notification }
                    clients[friend_request[0].from].sendUTF(JSON.stringify(data));
                }
                let delete_request = await UsersFriendRequestModel.deleteOne({ '_id': new mongodb.ObjectId(requestid) });
                return resp.status(200).json({ "status": 600, "message": "Request has been rejected.", 'result': delete_request, 'check_user_request_status': check_user_request_status });
            }
        } else {
            return resp.status(200).json({ "status": 300, "message": "Request rejected by sender.", 'result': check_user_request_status });
        }
    } catch (error) {
        return resp.status(500).json({ "status": 500, "message": error.message, 'result': {} });
    }
}

async function DeleteFriend(req, resp) {
    try {
        let { requestid = '', user_id } = req.body;
        if (!requestid) {
            return resp.status(200).json({ 'status': 400, 'message': 'request id required.' });
        }
        if (!user_id) {
            return resp.status(200).json({ 'status': 400, 'message': 'user id required.' });
        }
        let user_friend_request_model = new UsersFriendRequestModel;
        let friend_request = await user_friend_request_model.checkByRequestId(requestid);
        let notifyto = '', remove_by = '';
        if (user_id == friend_request[0].to.toString()) {
            notifyto = friend_request[0].from.toString();
            remove_by = friend_request[0].to_user_name;
        } else if (user_id == friend_request[0].from.toString()) {
            notifyto = friend_request[0].to.toString();
            remove_by = friend_request[0].from_user_name;
        }
        let notification = new AllNotificationsModel({
            notify_toid: notifyto,
            userid: user_id,
            requestid: requestid,
            from: friend_request[0].from,
            to: friend_request[0].to,
            accept_status: friend_request[0].accept_status,
            from_user_name: friend_request[0].from_user_name,
            from_user_photo: friend_request[0].from_user_photo,
            to_user_name: friend_request[0].to_user_name,
            to_user_photo: friend_request[0].to_user_photo,
            category: remove_friend,
            remove_byid: user_id,
            text: `${remove_by} remove you from friend list`,
            read_status: 0
        });
        notification = await notification.save();
        let file_name = friend_request[0].from_user_photo;
        let file_path = `${Healper.storageFolderPath()}users/${file_name}`;
        let file_view_path = `${APP_STORAGE}users/${file_name}`;
        let file_dtl = await Healper.FileInfo(file_name, file_path, file_view_path);

        let to_file_name = friend_request[0].to_user_photo;
        let to_file_path = `${Healper.storageFolderPath()}users/${to_file_name}`;
        let to_file_view_path = `${APP_STORAGE}users/${to_file_name}`;
        let to_file_dtl = await Healper.FileInfo(to_file_name, to_file_path, to_file_view_path);

        let reset_notification = {
            _id: notification._id,
            userid: notification.userid,
            requestid: notification.requestid,
            from: notification.from,
            to: notification.to,
            accept_status: notification.accept_status,
            from_user_name: notification.from_user_name,
            from_user_photo: notification.from_user_photo,
            to_user_name: notification.to_user_name,
            to_user_photo: notification.to_user_photo,
            category: notification.category,
            text: notification.text,
            read_status: notification.read_status,
            to_user_file_view_path: to_file_dtl.file_view_path,
            from_user_file_view_path: file_dtl.file_view_path,
            remove_byid: notification.remove_byid,
            notify_toid: notification.notify_toid,
            created_at: moment(notification.created_at).format('YYYY-MM-DD HH:mm:ss'),
        };
        if (clients[notifyto]) {
            let data = { "code": remove_friend, "message": "remove friend", 'result': reset_notification }
            clients[notifyto].sendUTF(JSON.stringify(data));
        }
        let delete_friend = await UsersFriendModel.deleteMany({ 'requestid': new mongodb.ObjectId(requestid) });
        let delete_request = await UsersFriendRequestModel.deleteOne({ '_id': new mongodb.ObjectId(requestid) });
        return resp.status(200).json({ "status": 200, "message": "Success", 'result': delete_request, 'delete_friend': delete_friend });
    } catch (error) {
        return resp.status(500).json({ "status": 500, "message": error.message, 'result': {} });
    }
}

module.exports = { SendRequest, CencelRequest, AcceptOrRejectRequest, DeleteFriend }