const moment = require('moment-timezone');
const UsersModel = require('../Models/UsersModel');
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
            // {
            //     $project: {
            //         tokens: -1,
            //     }
            // }
        ]);
        let total = await UsersModel
            .find(query)
            .countDocuments();
        totalpage = Math.ceil(total / limit);
        let resetdata_is = [];
        let filedata = new Promise((resolve, reject) => {
            let resetdata = [];
            try {
                list.forEach(async element => {
                    let file_name = `${element.photo}`;
                    let file_path = `${Healper.storageFolderPath()}users/${file_name}`;
                    let file_view_path = `${APP_STORAGE}users/${file_name}`;
                    let file_dtl = await Healper.FileInfo(file_name, file_path, file_view_path);
                    let obj = {
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
                    }
                    resetdata.push(obj);
                });
                resolve(resetdata);
            } catch (error) {
                reject(error.message);
            }
        });
        await filedata.then((datais) => {
            resetdata_is = datais;
        }).catch((error) => {
            throw new Error(error);
        });
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