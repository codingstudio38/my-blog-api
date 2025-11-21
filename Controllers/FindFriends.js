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
            { $sort: { _id: -1 } },
            { $skip: skip },
            { $limit: limit },
        ]);
        let total = await UsersModel
            .find(query)
            .countDocuments();
        totalpage = Math.ceil(total / limit);
        const user_friend_model = new UsersFriendModel;
        const user_friend_request_model = new UsersFriendRequestModel;
        let resetdata_is = await Promise.all(
            list.map(async (element) => {
                let uid = element._id.toString();
                let totalfriend = await user_friend_model.IsFriend(user_id, uid);
                let friend_request = await user_friend_request_model.checkFriendRequest(user_id, uid);
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
                    "is_friend": totalfriend,
                    "friend_request": friend_request.length > 0 ? friend_request[0] : null,
                    "check_friend_request": friend_request.length > 0 ? 1 : 0,
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

module.exports = { AllUsers };