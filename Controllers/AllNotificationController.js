const mongodb = require('mongodb');
const moment = require('moment-timezone');
const mongoose = require('mongoose');
const AllNotificationsModel = require('../Models/AllNotificationsModel');
const Healper = require('./Healper');
// const { WebsocketController, clients } = require("./WebsocketController");
const new_friend_request = process.env.new_friend_request;
const cencel_friend_request = process.env.cencel_friend_request;
const accept_friend_request = process.env.accept_friend_request;
const reject_friend_request = process.env.reject_friend_request;
const remove_friend = process.env.remove_friend;
const APP_STORAGE = process.env.APP_STORAGE;

async function AllNotifications(req, resp) {
    try {
        let { limit = 5, page = 1 } = req.query;
        let { user_id = '' } = req.body;
        let skip = 0, totalpage = 0;
        limit = parseInt(limit);
        page = parseInt(page);
        skip = (page - 1) * limit;

        let andConditions = [];
        andConditions.push({ delete: 0 });
        andConditions.push({ read_status: 0 });
        andConditions.push({ notify_toid: { $eq: new mongodb.ObjectId(user_id) } });
        let query = andConditions.length > 0 ? { $and: andConditions } : {};

        let list = await AllNotificationsModel.aggregate([
            { $match: query },
            { $sort: { _id: -1 } },
            // { $skip: skip },
            // { $limit: limit },
        ]);
        let total = await AllNotificationsModel
            .find(query)
            .countDocuments();
        totalpage = Math.ceil(total / limit);
        let resetdata_is = await Promise.all(
            list.map(async (element) => {
                let file_name = element.from_user_photo;
                let file_path = `${Healper.storageFolderPath()}users/${file_name}`;
                let file_view_path = `${APP_STORAGE}users/${file_name}`;
                let file_dtl = await Healper.FileInfo(file_name, file_path, file_view_path);

                let to_file_name = element.to_user_photo;
                let to_file_path = `${Healper.storageFolderPath()}users/${to_file_name}`;
                let to_file_view_path = `${APP_STORAGE}users/${to_file_name}`;
                let to_file_dtl = await Healper.FileInfo(to_file_name, to_file_path, to_file_view_path);
                return {
                    ...element,
                    "created_at": moment(element.created_at).format('YYYY-MM-DD HH:mm:ss'),
                    "updated_at": element.updated_at == null ? null : moment(element.updated_at).format('YYYY-MM-DD HH:mm:ss'),
                    to_user_file_view_path: to_file_dtl.file_view_path,
                    from_user_file_view_path: file_dtl.file_view_path,
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

async function ReadThis(req, resp) {
    try {
        let { id = '' } = req.body;
        if (id == "") {
            console.log('ws user id required');
            return 0;
        }
        let updateis = await AllNotificationsModel.updateOne({ _id: id }, { $set: { read_status: 1 } });
        return resp.status(200).json({ "status": 200, "message": "Successfully updated", 'result': updateis });
    } catch (error) {
        return resp.status(200).json({ "status": 200, "message": "Failed to update", 'result': [] });
    }
}

module.exports = { AllNotifications, ReadThis }