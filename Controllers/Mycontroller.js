const mongodb = require('mongodb');
const moment = require('moment-timezone');
const mongoose = require('mongoose');
const UsersModel = require('../Models/UsersModel');
const Healper = require('./Healper');
const bcrypt = require("bcrypt");
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const APP_URL = process.env.APP_URL;
const APP_STORAGE = process.env.APP_STORAGE;
async function Users(req, resp) {
    try {
        let { limit = 5, page = 1 } = req.query;
        let { name = '' } = req.body;
        let skip = 0;
        limit = parseInt(limit);
        page = parseInt(page);
        skip = (page - 1) * limit;
        let query = {};
        if (name !== '') {
            query = {
                $or: [
                    { name: { $regex: new RegExp(name), $options: "i" } },
                    { email: { $regex: new RegExp(name), $options: "i" } },
                ],
            };
        }
        let list = await UsersModel
            .find(query)
            .select({ tokens: 0 })
            .skip(skip).limit(limit);
        let total = await UsersModel
            .find(query)
            .countDocuments();
        let data = {
            list: list,
            total: total,
            pagination: Healper.PaginationData(list, total, limit, page)
        };
        return resp.status(200).json({ "status": 200, "message": "Success", 'result': data });
    } catch (error) {
        return resp.status(500).json({ "status": 500, "message": error.message, 'result': {} });
    }
}

async function CreateUser(req, resp) {
    try {
        let { name = '', phone = '', email = '', password = '' } = req.body;
        if (!name) {
            return resp.status(200).json({ 'status': 400, 'message': 'name required.' });
        }
        if (!phone) {
            return resp.status(200).json({ 'status': 400, 'message': 'phone no required.' });
        }
        if (isNaN(phone)) {
            return resp.status(200).json({ 'status': 400, 'message': 'phone no allow only numbers.' });
        }
        phone = parseInt(phone);
        if (!email) {
            return resp.status(200).json({ 'status': 400, 'message': 'email id required.' });
        }
        if (!password) {
            return resp.status(200).json({ 'status': 400, 'message': 'password required.' });
        }

        const email_check = await UsersModel.find({ email: { $eq: email } }).countDocuments();
        if (email_check > 0) {
            return resp.status(200).json({ "status": 400, "message": "Email Id already exist. Try different." });
        }
        const phone_check = await UsersModel.find({ phone: { $eq: phone } }).countDocuments();
        if (phone_check > 0) {
            return resp.status(200).json({ "status": 400, "message": "Phone no already exist. Try different.", "total": phone_check });
        }
        let salt = await bcrypt.genSalt(10);//genSaltSync(10)
        let password_ = await bcrypt.hash(password, salt);//hashSync(password,salt);
        let NewUser = new UsersModel({
            name: name,
            phone: phone,
            email: email,
            password: password_,
        });
        NewUser = await NewUser.save();
        return resp.status(200).json({ "status": 200, "message": "Success", 'result': NewUser });
    } catch (error) {
        return resp.status(500).json({ "status": 500, "message": error.message, 'result': {} });
    }
}

async function UpdateUser(req, resp) {
    try {
        let {
            name = '',
            phone = '',
            email = '',
            password = '',
            id = '',
            occupation = '',
            skills = '',
            dob = '',
            country = '',
            address = '',
            about_us = '',
        } = req.body;
        if (!id) {
            return resp.status(200).json({ 'status': 400, 'message': 'id required.' });
        }
        if (!name) {
            return resp.status(200).json({ 'status': 400, 'message': 'name required.' });
        }
        if (!phone) {
            return resp.status(200).json({ 'status': 400, 'message': 'phone no required.' });
        }
        if (isNaN(phone)) {
            return resp.status(200).json({ 'status': 400, 'message': 'phone no allow only numbers.' });
        }
        phone = parseInt(phone);
        if (!email) {
            return resp.status(200).json({ 'status': 400, 'message': 'email id required.' });
        }
        // if (!password) {
        //     return resp.status(200).json({ 'status': 400, 'message': 'password required.' });
        // }

        const email_check = await UsersModel.find({ $and: [{ _id: { $ne: new mongodb.ObjectId(id) } }, { email: { $eq: email } }] }).countDocuments();
        if (email_check > 0) {
            return resp.status(200).json({ "status": 400, "message": "Email Id already exist. Try different." });
        }
        const phone_check = await UsersModel.find({ $and: [{ _id: { $ne: new mongodb.ObjectId(id) } }, { phone: { $eq: phone } }] }).countDocuments();
        if (phone_check > 0) {
            return resp.status(200).json({ "status": 400, "message": "Phone no already exist. Try different.", "total": phone_check });
        }

        let updatedata = {
            name: name,
            phone: phone,
            email: email,
            occupation: occupation,
            skills: skills,
            country: country,
            address: address,
            about_us: about_us,
            updated_at: moment().tz(process.env.TIMEZONE).format('YYYY-MM-DD HH:mm:ss'),
        };
        if (dob !== '' && dob !== null) {
            updatedata['dob'] = moment(dob).format('YYYY-MM-DD');
        }
        if (password !== '') {
            let salt = await bcrypt.genSalt(10);//genSaltSync(10)
            let password_ = await bcrypt.hash(password, salt);//hashSync(password,salt);
            updatedata['password'] = password_;
        }

        let updateis = await UsersModel.findByIdAndUpdate(
            { _id: new mongodb.ObjectId(id) },
            { $set: updatedata },
            { new: true, useFindAndModify: false }
        );
        return resp.status(200).json({ "status": 200, "message": "Success", 'result': updateis });
    } catch (error) {
        return resp.status(500).json({ "status": 500, "message": error.message, 'result': {} });
    }
}

async function UpdateUserPhoto(req, resp) {
    try {
        let { userid = '' } = req.body;
        let fileIs = '', file_size = 0, file_name = '', file_type = '', file_new_name = '', file_mimetype = '', user_files = '', user_old_file_path = '';
        user_files = `${Healper.storageFolderPath()}users`;
        if (!userid) {
            return resp.status(200).json({ 'status': 400, 'message': 'id required.' });
        }
        if (!req.files) {
            return resp.status(200).json({ "status": 200, "message": "file not found!", "data": result });
        }
        if (!fs.existsSync(user_files)) {
            fs.mkdirSync(user_files, { recursive: true });
        }
        fileIs = req.files.photo;
        file_size = fileIs.size;
        file_name = fileIs.name;
        const file_n = file_name.split(".");
        file_type = file_n[file_n.length - 1];
        file_mimetype = fileIs.mimetype;
        file_new_name = `${crypto.randomBytes(8).toString('hex')}.${file_type}`;
        await fileIs.mv(`${user_files}/${file_new_name}`);
        const user = await UsersModel.findOne({ _id: new mongodb.ObjectId(userid) });
        if (user == null) {
            return resp.status(200).json({ "status": 400, "message": "user not found!" });
        }
        let updatedata = {
            photo: file_new_name,
            updated_at: moment().tz(process.env.TIMEZONE).format('YYYY-MM-DD HH:mm:ss'),
        };

        await UsersModel.findByIdAndUpdate(
            { _id: new mongodb.ObjectId(userid) },
            { $set: updatedata },
            { new: true, useFindAndModify: false }
        );

        const result = { "status": 200, "message": "Success", 'result': `${APP_STORAGE}users/${file_new_name}`, 'file_name': file_new_name }

        if (user.photo !== null) {
            user_old_file_path = `${user_files}/${user.photo}`;
            if (fs.existsSync(user_old_file_path)) {
                fs.unlinkSync(user_old_file_path);
            }
        }

        return resp.status(200).json(result);
    } catch (error) {
        return resp.status(500).json({ "status": 500, "message": error.message, 'result': {} });
    }
}

async function Userlogin(req, resp) {
    try {
        let { email = '', password = '' } = req.body;
        if (!email) {
            return resp.status(200).json({ 'status': 400, 'message': 'email id required.' });
        }
        if (!password) {
            return resp.status(200).json({ 'status': 400, 'message': 'password required.' });
        }

        const user = await UsersModel.findOne({ email: { $eq: email } });
        if (user == null) {
            return resp.status(200).json({ "status": 400, "message": "Login failed!" });
        }
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return resp.status(200).json({ "status": 400, "message": "Login failed!" });
        }

        const token = await user.generateAuthToken();
        let data = {
            "_id": user['_id'],
            "name": user['name'],
            "phone": user['phone'],
            "email": user['email'],
            "photo": user['photo'],
            "password": user['password'],
            "active_status": user['active_status'],
            "created_at": user['created_at'],
            "updated_at": user['updated_at'],
            "token": token,
            "occupation": user['occupation'],
            "skills": user['skills'],
            "dob": user['dob'],
            "country": user['country'],
            "address": user['address'],
            "about_us": user['about_us'],
            "wsstatus": user['wsstatus'],
        }
        return resp.status(200).json({ "status": 200, "message": "Successfully logged in.", "user": data });
    } catch (error) {
        return resp.status(500).json({ "status": 500, "message": error.message, 'result': {} });
    }
}
async function UserLogout(req, resp) {
    try {
        // req.user.tokens = req.user.tokens.filter((items, index) => {
        //     return items.token !== req.token;
        // }) 
        req.user.tokens = [];
        await req.user.save();
        return resp.status(200).json({ "status": 200, "message": "Successfully logged out." });
    } catch (error) {
        return resp.status(400).json({ "status": 400, "message": "Failed..!!", "error": error.message });
    }
}



async function CkeditorfileUpload(req, resp) {
    try {
        let { ckCsrfToken = '' } = req.body;
        let fileIs = '', file_size = 0, file_name = '', file_type = '', file_new_name = '', file_mimetype = '', user_files = '';
        user_files = `${Healper.storageFolderPath()}ckeditor`;
        if (!ckCsrfToken) {
            return resp.status(400).json({ 'status': 400, 'message': 'csrf token required.' });
        }
        if (!req.files) {
            return resp.status(200).json({ "status": 200, "message": "file not found!", "data": result });
        }
        if (!fs.existsSync(user_files)) {
            fs.mkdirSync(user_files, { recursive: true });
        }
        fileIs = req.files.upload;
        file_size = fileIs.size;
        file_name = fileIs.name;
        const file_n = file_name.split(".");
        file_type = file_n[file_n.length - 1];
        file_mimetype = fileIs.mimetype;
        file_new_name = `${crypto.randomBytes(8).toString('hex')}.${file_type}`;
        await fileIs.mv(`${user_files}/${file_new_name}`);
        const result = { "status": 200, "message": "Success", 'result': `${APP_STORAGE}ckeditor/${file_new_name}`, url: `${APP_STORAGE}ckeditor/${file_new_name}`, fileName: file_new_name, uploaded: 1 }
        return resp.status(200).json(result);
    } catch (error) {
        return resp.status(500).json({ "status": 500, "message": error.message, 'result': {} });
    }
}

async function UserByid(req, resp) {
    try {
        let { id = '' } = req.params;
        if (!id) {
            return resp.status(200).json({ "status": 500, "message": 'id required', 'result': {} });
        }
        let umodel = new UsersModel();
        let user = await umodel.findByUserId(id);
        let obj = {};
        if (user !== null) {
            let file_name = `${user.photo}`;
            let file_path = `${Healper.storageFolderPath()}users/${file_name}`;
            let file_view_path = `${APP_STORAGE}users/${file_name}`;
            let file_dtl = await Healper.FileInfo(file_name, file_path, file_view_path);
            obj = {
                "_id": user._id,
                "wsstatus": user.wsstatus,
                "name": user.name,
                "phone": user.phone,
                "email": user.email,
                "photo": user.photo,
                "password": user.password,
                "active_status": user.active_status,
                "file_dtl": file_dtl,
                "occupation": user.occupation,
                "skills": user.skills,
                "dob": user.dob !== null ? moment(user.dob).format('YYYY-MM-DD') : null,
                "country": user.country,
                "address": user.address,
                "about_us": user.about_us,
                "created_at": moment(user.created_at).format('YYYY-MM-DD HH:mm:ss'),
                "updated_at": user.updated_at == null ? null : moment(user.updated_at).format('YYYY-MM-DD HH:mm:ss'),
            }
        }
        let data = {
            result: obj,
            total: user !== null ? 1 : 0
        };
        return resp.status(200).json({ "status": 200, "message": "Success", 'result': data });
    } catch (error) {
        return resp.status(500).json({ "status": 500, "message": error.message, 'result': {} });
    }
}


async function UpdateUserWsStatus(userid, Status) {
    try {
        if (userid == "") {
            console.log('ws user id required');
            return 0;
        }
        let updateis = await UsersModel.updateOne({ _id: userid }, { $set: { wsstatus: Status } });
        console.log({ "status": 200, "message": "Success ws status updated" });//, "data": updateis 
        return 1;
    } catch (error) {
        console.log({ "status": 400, "message": "Failed to update es status" });//, "error": error.message 
        return 0;
    }
}

module.exports = { Users, CreateUser, Userlogin, UpdateUser, UserLogout, UpdateUserPhoto, CkeditorfileUpload, UserByid, UpdateUserWsStatus };