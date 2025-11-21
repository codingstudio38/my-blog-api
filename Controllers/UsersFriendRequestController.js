const mongodb = require('mongodb');
const moment = require('moment-timezone');
const mongoose = require('mongoose');
const UsersFriendRequestModel = require('../Models/UsersFriendRequestModel');
const UsersFriendModel = require('../Models/UsersFriendModel');
const Healper = require('./Healper');

async function SendRequest(req, resp) {
    try {
        let { from = '', to = '' } = req.body;
        if (!from) {
            return resp.status(200).json({ 'status': 400, 'message': 'from id required.' });
        }
        if (!to) {
            return resp.status(200).json({ 'status': 400, 'message': 'to id required.' });
        }

        let NewRequest = new UsersFriendRequestModel({
            from: from,
            to: to,
            accept_status: 0,
        });
        NewRequest = await NewRequest.save();
        const user_friend_request_model = new UsersFriendRequestModel;
        let friend_request = await user_friend_request_model.checkFriendRequest(from, to);
        return resp.status(200).json({ "status": 200, "message": "Success", 'result': NewRequest, 'friend_request': friend_request });
    } catch (error) {
        return resp.status(500).json({ "status": 500, "message": error.message, 'result': {} });
    }
}

async function CencelRequest(req, resp) {
    try {
        let { from = '', to = '', requestid = '' } = req.body;
        if (!from) {
            return resp.status(200).json({ 'status': 400, 'message': 'from id required.' });
        }
        if (!to) {
            return resp.status(200).json({ 'status': 400, 'message': 'to id required.' });
        }

        const check_user_accept_satus = await UsersFriendModel.find({
            $and: [
                { 'requestid': new mongodb.ObjectId(requestid) },
                { 'delete': 0 }
            ]
        }).countDocuments();
        // const check_user_request_status = await UsersFriendRequestModel.find({
        //     $and: [
        //         { _id: new mongodb.ObjectId(requestid) },
        //         { 'delete': 0 }
        //     ]
        // }).countDocuments();
        if (check_user_accept_satus <= 0) {
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
            return resp.status(200).json({ "status": 200, "message": "Success", 'result': delete_request, 'delete_friend': delete_friend });
        } else {
            return resp.status(200).json({ "status": 300, "message": "Success", 'result': check_user_accept_satus });
        }
    } catch (error) {
        return resp.status(500).json({ "status": 500, "message": error.message, 'result': {} });
    }
}

async function AcceptOrRejectRequest(req, resp) {
    try {
        let { from = '', to = '', requestid = '', accept_status = 0 } = req.body;
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
            if (accept_status == 1) {//accept
                let save_friends = await UsersFriendModel.insertMany([
                    { requestid: requestid, userid: from, friend: to, delete: 0 },
                    { requestid: requestid, userid: to, friend: from, delete: 0 }
                ]);
                let update_request = await UsersFriendRequestModel.updateOne({ _id: new mongodb.ObjectId(requestid) }, { $set: { accept_status: 1 } });
                return resp.status(200).json({ "status": 200, "message": "Success", 'result': save_friends, 'update_request': update_request });
            } else {//reject
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
        let { requestid = '' } = req.body;
        if (!requestid) {
            return resp.status(200).json({ 'status': 400, 'message': 'request id required.' });
        }
        let delete_friend = await UsersFriendModel.deleteMany({ 'requestid': new mongodb.ObjectId(requestid) });
        let delete_request = await UsersFriendRequestModel.deleteOne({ '_id': new mongodb.ObjectId(requestid) });
        return resp.status(200).json({ "status": 200, "message": "Success", 'result': delete_request, 'delete_friend': delete_friend });
    } catch (error) {
        return resp.status(500).json({ "status": 500, "message": error.message, 'result': {} });
    }
}

module.exports = { SendRequest, CencelRequest, AcceptOrRejectRequest, DeleteFriend }