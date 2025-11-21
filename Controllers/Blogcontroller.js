const mongodb = require('mongodb');
const moment = require('moment-timezone');
const mongoose = require('mongoose');
const UsersModel = require('../Models/UsersModel');
const BlogsModel = require('../Models/BlogsModel');
const BlogsCategoryModel = require('../Models/BlogCategoryModel');
const Healper = require('./Healper');
const bcrypt = require("bcrypt");
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const APP_URL = process.env.APP_URL;
const APP_STORAGE = process.env.APP_STORAGE;
async function UplodePhoto(req, resp) {
    try {
        let { userid = '' } = req.body;
        let fileIs = '', file_size = 0, file_name = '', file_type = '', file_new_name = '', file_mimetype = '', blog_file_path = '';
        blog_file_path = `${Healper.storageFolderPath()}user-blogs/temp/user${userid}`;
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
        const result = { "status": 200, "message": "Success", 'result': `${APP_STORAGE}user-blogs/temp/user${userid}/${file_new_name}`, 'file_name': file_new_name }
        return resp.status(200).json(result);
    } catch (error) {
        return resp.status(500).json({ "status": 500, "message": error.message, 'result': {} });
    }
}

async function UplodeThumbnail(req, resp) {
    try {
        let { userid = '' } = req.body;
        let fileIs = '', file_size = 0, file_name = '', file_type = '', file_new_name = '', file_mimetype = '', blog_file_path = '';
        blog_file_path = `${Healper.storageFolderPath()}user-blogs/temp/user-blogs-thumbnail/user${userid}`;
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
        const result = { "status": 200, "message": "Success", 'result': `${APP_STORAGE}user-blogs/temp/user-blogs-thumbnail/user${userid}/${file_new_name}`, 'file_name': file_new_name }
        return resp.status(200).json(result);
    } catch (error) {
        return resp.status(500).json({ "status": 500, "message": error.message, 'result': {} });
    }
}


async function CreactBlog(req, resp) {
    try {
        let { user_id = '', title = '', content = '', photo = '', sort_description = '', blog_type = '', thumbnail = '' } = req.body;
        let content_alias = '',
            blog_file_path = `${Healper.storageFolderPath()}user-blogs/temp/user${user_id}/${photo}`,
            new_blog_file_path = `${Healper.storageFolderPath()}user-blogs/${photo}`;
        if (!user_id) {
            return resp.status(200).json({ 'status': 400, 'message': 'user id required.' });
        }
        if (!blog_type) {
            return resp.status(200).json({ 'status': 400, 'message': 'blog type required.' });
        }
        if (!title) {
            return resp.status(200).json({ 'status': 400, 'message': 'title required.' });
        }
        if (!sort_description) {
            return resp.status(200).json({ 'status': 400, 'message': 'sort description required.' });
        }
        if (!content) {
            return resp.status(200).json({ 'status': 400, 'message': 'content required.' });
        }
        if (!photo) {
            return resp.status(200).json({ 'status': 400, 'message': 'photo required.' });
        }
        if (blog_type == "691beef0c2cfd41cc117ef71" || blog_type == "691beef0c2cfd41cc117ef6f" || blog_type == "691beef0c2cfd41cc117ef6e") {
            if (!thumbnail) {
                return resp.status(200).json({ 'status': 400, 'message': 'thumbnail required.' });
            }
        } else {
            thumbnail = '';
        }
        content_alias = title.trim().replaceAll(" ", "-");
        content_alias = `${content_alias}-${Healper.generateRandomString(6)}`;
        if (!fs.existsSync(`${blog_file_path}`)) {
            return resp.status(200).json({ 'status': 400, 'message': 'file not found required.' });
        }
        const p_path = `${Healper.storageFolderPath()}user-blogs`;
        if (!fs.existsSync(p_path)) {
            fs.mkdirSync(p_path, { recursive: true });
        }
        await fs.rename(blog_file_path, new_blog_file_path, (err) => {
            if (err) {
                return resp.status(200).json({ 'status': 400, 'message': 'Error moving file' });
            }
        })
        let data = {
            user_id: user_id,
            title: title,
            content: content,
            photo: photo,
            content_alias: content_alias,
            blog_type: blog_type,
            sort_description: sort_description,
        };
        if (blog_type == "691beef0c2cfd41cc117ef71" || blog_type == "691beef0c2cfd41cc117ef6f" || blog_type == "691beef0c2cfd41cc117ef6e") {

        } else {
            data['thumbnail'] = '';
        }
        if (thumbnail !== '') {
            let thumbnail_file_path = `${Healper.storageFolderPath()}user-blogs/temp/user-blogs-thumbnail/user${user_id}/${thumbnail}`;
            let new_thumbnail_file_path = `${Healper.storageFolderPath()}user-blogs/thumbnail/${thumbnail}`;
            const t_path = `${Healper.storageFolderPath()}user-blogs/thumbnail`;
            if (!fs.existsSync(t_path)) {
                fs.mkdirSync(t_path, { recursive: true });
            }
            await fs.rename(thumbnail_file_path, new_thumbnail_file_path, (err) => {
                if (err) {
                    return resp.status(200).json({ 'status': 400, 'message': 'Error moving thumbnail' });
                }
            })
            data['thumbnail'] = thumbnail;
        }

        let Blog = new BlogsModel(data);
        Blog = await Blog.save();
        return resp.status(200).json({ "status": 200, "message": "Success", 'result': Blog });
    } catch (error) {
        return resp.status(500).json({ "status": 500, "message": error.message, 'result': {} });
    }
}



async function Myblogs(req, resp) {
    try {
        let { limit = 5, page = 1 } = req.query;
        let { title = '', user_id = '' } = req.body;
        let skip = 0;
        limit = parseInt(limit);
        page = parseInt(page);
        skip = (page - 1) * limit;
        let andConditions = [];

        if (title !== '') {
            andConditions.push({ title: { $regex: new RegExp(title, "i") } });
        }
        if (user_id !== '') {
            andConditions.push({ user_id: new mongodb.ObjectId(user_id) });
        }
        andConditions.push({ delete: 0 });
        let query = andConditions.length > 0 ? { $and: andConditions } : {};
        // let list = await BlogsModel
        //     .find(query)
        //     .sort({ _id: -1 })
        //     .skip(skip).limit(limit);
        let list = await BlogsModel.aggregate([
            { $match: query },
            {
                $lookup: {
                    from: "users", // collection name (not model name)
                    localField: "user_id",
                    foreignField: "_id",
                    as: "user_detail"
                }
            },
            { $unwind: { path: "$user_detail", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: "blog_categories",
                    localField: "blog_type",
                    foreignField: "_id",
                    as: "category_detail"
                }
            },
            { $unwind: { path: "$category_detail", preserveNullAndEmptyArrays: true } },
            { $sort: { _id: -1 } },
            { $skip: skip },
            { $limit: limit },
            {
                $project: {
                    _id: 1,
                    title: 1,
                    content: 1,
                    photo: 1,
                    content_alias: 1,
                    active_status: 1,
                    created_at: 1,
                    updated_at: 1,
                    blog_type: 1,
                    sort_description: 1,
                    user_name: "$user_detail.name",
                    user_photo: "$user_detail.photo",
                    category_type_name: "$category_detail.name",
                    thumbnail: 1,
                }
            }
        ]);
        let total = await BlogsModel
            .find(query)
            .countDocuments();

        let resetdata_is = [];
        let filedata = new Promise((resolve, reject) => {
            let resetdata = [];
            try {
                list.forEach(async element => {
                    let file_name = `${element.photo}`;
                    let file_path = `${Healper.storageFolderPath()}user-blogs/${file_name}`;
                    let file_view_path = `${APP_STORAGE}user-blogs/${file_name}`;
                    let file_dtl = await Healper.FileInfo(file_name, file_path, file_view_path);

                    let user_file_name = `${element.user_photo}`;
                    let user_file_path = `${Healper.storageFolderPath()}users/${user_file_name}`;
                    let user_file_view_path = `${APP_STORAGE}users/${user_file_name}`;
                    let user_file_dtl = await Healper.FileInfo(user_file_name, user_file_path, user_file_view_path);

                    let thumbnail_name = `${element.thumbnail}`;
                    let thumbnail_path = `${Healper.storageFolderPath()}user-blogs/thumbnail/${thumbnail_name}`;
                    let thumbnail_view_path = `${APP_STORAGE}user-blogs/thumbnail/${thumbnail_name}`;
                    let thumbnail_dtl = await Healper.FileInfo(thumbnail_name, thumbnail_path, thumbnail_view_path);


                    let obj = {
                        "_id": element._id,
                        "user_id": element.user_id,
                        "title": element.title,
                        "content": element.content,
                        "photo": element.photo,
                        "content_alias": element.content_alias,
                        "active_status": element.active_status,
                        "file_dtl": file_dtl,
                        "created_at": moment(element.created_at).format('YYYY-MM-DD HH:mm:ss'),
                        "updated_at": element.updated_at == null ? null : moment(element.updated_at).format('YYYY-MM-DD HH:mm:ss'),
                        "user_name": element.user_name,
                        "user_photo": element.user_photo,
                        "user_file_dtl": user_file_dtl,
                        "blog_type": element.blog_type,
                        "category_type_name": element.category_type_name,
                        "sort_description": element.sort_description,
                        "thumbnail": element.thumbnail,
                        "thumbnail_dtl": thumbnail_dtl,
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
            pagination: Healper.PaginationData(resetdata_is, total, limit, page)
        };
        return resp.status(200).json({ "status": 200, "message": "Success", 'result': data });
    } catch (error) {
        return resp.status(500).json({ "status": 500, "message": error.message, 'result': {} });
    }
}


async function BlogByid(req, resp) {
    try {
        let { id = '' } = req.params;
        if (!id) {
            return resp.status(200).json({ "status": 500, "message": 'id required', 'result': {} });
        }
        let bmodel = new BlogsModel();
        let blog = await bmodel.findByBlogId(id);
        let obj = {};
        if (blog !== null) {
            let file_name = `${blog.photo}`;
            let file_path = `${Healper.storageFolderPath()}user-blogs/${file_name}`;
            let file_view_path = `${APP_STORAGE}user-blogs/${file_name}`;
            let file_dtl = await Healper.FileInfo(file_name, file_path, file_view_path);

            let thumbnail_name = `${blog.thumbnail}`;
            let thumbnail_path = `${Healper.storageFolderPath()}user-blogs/thumbnail/${thumbnail_name}`;
            let thumbnail_view_path = `${APP_STORAGE}user-blogs/thumbnail/${thumbnail_name}`;
            let thumbnail_dtl = await Healper.FileInfo(thumbnail_name, thumbnail_path, thumbnail_view_path);

            obj = {
                "_id": blog._id,
                "user_id": blog.user_id,
                "title": blog.title,
                "content": blog.content,
                "photo": blog.photo,
                "content_alias": blog.content_alias,
                "active_status": blog.active_status,
                "file_dtl": file_dtl,
                "created_at": moment(blog.created_at).format('YYYY-MM-DD HH:mm:ss'),
                "updated_at": blog.updated_at == null ? null : moment(blog.updated_at).format('YYYY-MM-DD HH:mm:ss'),
                "blog_type": blog.blog_type,
                "sort_description": blog.sort_description,
                "thumbnail": blog.thumbnail,
                "thumbnail_dtl": thumbnail_dtl,
            }
        }
        let data = {
            result: obj,
            total: blog !== null ? 1 : 0
        };
        return resp.status(200).json({ "status": 200, "message": "Success", 'result': data });
    } catch (error) {
        return resp.status(500).json({ "status": 500, "message": error.message, 'result': {} });
    }
}

async function DeleteBlogByid(req, resp) {
    try {
        let { id = '' } = req.params;
        if (!id) {
            return resp.status(200).json({ "status": 500, "message": 'id required', 'result': {} });
        }
        const deleteis = await BlogsModel.findByIdAndUpdate(id, { delete: 1, updated_at: moment().tz(process.env.TIMEZONE).format('YYYY-MM-DD HH:mm:ss'), });
        return resp.status(200).json({ "status": 200, "message": "Success", 'result': deleteis });
    } catch (error) {
        return resp.status(500).json({ "status": 500, "message": error.message, 'result': {} });
    }
}
async function UpdateBlog(req, resp) {
    try {
        let { id = '', user_id = '', title = '', content = '', photo = '', sort_description = '', blog_type = '', thumbnail = '' } = req.body;
        let content_alias = '',
            blog_file_path = `${Healper.storageFolderPath()}user-blogs/temp/user${user_id}/${photo}`,
            new_blog_file_path = `${Healper.storageFolderPath()}user-blogs/${photo}`;
        if (!id) {
            return resp.status(200).json({ 'status': 400, 'message': 'id required.' });
        }
        if (!user_id) {
            return resp.status(200).json({ 'status': 400, 'message': 'user id required.' });
        }
        if (!blog_type) {
            return resp.status(200).json({ 'status': 400, 'message': 'blog type required.' });
        }
        if (!title) {
            return resp.status(200).json({ 'status': 400, 'message': 'title required.' });
        }
        if (!sort_description) {
            return resp.status(200).json({ 'status': 400, 'message': 'sort description required.' });
        }
        if (!content) {
            return resp.status(200).json({ 'status': 400, 'message': 'content required.' });
        }
        if (blog_type == "691beef0c2cfd41cc117ef71" || blog_type == "691beef0c2cfd41cc117ef6f" || blog_type == "691beef0c2cfd41cc117ef6e") {
            // if (!thumbnail) {
            //     return resp.status(200).json({ 'status': 400, 'message': 'thumbnail required.' });
            // }
        } else {
            thumbnail = '';
        }
        let bmodel = new BlogsModel();
        let blogis = await bmodel.findByBlogId(id);
        content_alias = title.trim().replaceAll(" ", "-");
        content_alias = `${content_alias}-${Healper.generateRandomString(6)}`;
        let update = {
            user_id: user_id,
            title: title,
            content: content,
            content_alias: content_alias,
            updated_at: moment().tz(process.env.TIMEZONE).format('YYYY-MM-DD HH:mm:ss'),
            blog_type: blog_type,
            sort_description: sort_description,
        };

        let thumbnail_file_path = `${Healper.storageFolderPath()}user-blogs/temp/user-blogs-thumbnail/user${user_id}/${thumbnail}`;
        let new_thumbnail_file_path = `${Healper.storageFolderPath()}user-blogs/thumbnail/${thumbnail}`;

        if (thumbnail !== '') {
            const t_path = `${Healper.storageFolderPath()}user-blogs/thumbnail`;
            if (!fs.existsSync(t_path)) {
                fs.mkdirSync(t_path, { recursive: true });
            }
            if (fs.existsSync(`${thumbnail_file_path}`)) {
                await fs.rename(thumbnail_file_path, new_thumbnail_file_path, (err) => {
                    if (err) {
                        return resp.status(200).json({ 'status': 400, 'message': 'Error moving file' });
                    }
                })
                update['thumbnail'] = thumbnail;
            } else {
                return resp.status(200).json({ 'status': 400, 'message': 'thumbnail file not found required.' });
            }
        }
        if (blog_type == "691beef0c2cfd41cc117ef71" || blog_type == "691beef0c2cfd41cc117ef6f" || blog_type == "691beef0c2cfd41cc117ef6e") {

        } else {
            update['thumbnail'] = '';
        }

        if (photo !== "") {
            const p_path = `${Healper.storageFolderPath()}user-blogs`;
            if (!fs.existsSync(p_path)) {
                fs.mkdirSync(p_path, { recursive: true });
            }
            if (fs.existsSync(`${blog_file_path}`)) {
                await fs.rename(blog_file_path, new_blog_file_path, (err) => {
                    if (err) {
                        return resp.status(200).json({ 'status': 400, 'message': 'Error moving file' });
                    }
                })
                update['photo'] = photo;
            } else {
                return resp.status(200).json({ 'status': 400, 'message': 'file not found required.' });
            }
        }
        let Blog = await BlogsModel.findByIdAndUpdate(
            { _id: new mongodb.ObjectId(id) },
            { $set: update },
            { new: true, useFindAndModify: false }
        );


        if (photo !== "" && fs.existsSync(`${new_blog_file_path}`)) {
            const old_file = `${Healper.storageFolderPath()}user-blogs/${blogis.photo}`;
            if (fs.existsSync(`${old_file}`)) {
                fs.unlinkSync(`${old_file}`);
            }
        }
        if (thumbnail !== "" && fs.existsSync(`${new_thumbnail_file_path}`)) {
            const old_file = `${Healper.storageFolderPath()}user-blogs/thumbnail/${blogis.thumbnail}`;
            if (fs.existsSync(`${old_file}`)) {
                fs.unlinkSync(`${old_file}`);
            }
        }
        return resp.status(200).json({ "status": 200, "message": "Success", 'result': Blog });
    } catch (error) {
        return resp.status(500).json({ "status": 500, "message": error.message, 'result': {} });
    }
}

async function BlogsCategoryList(req, resp) {
    try {
        let { name = '' } = req.body;
        let andConditions = [];
        if (name !== '') {
            andConditions.push({ name: { $regex: new RegExp(name, "i") } });
        }
        andConditions.push({ delete: 0 });
        let query = andConditions.length > 0 ? { $and: andConditions } : {};
        let list = await BlogsCategoryModel
            .find(query);
        let data = {
            list: list,
            total: list.length,
        };
        return resp.status(200).json({ "status": 200, "message": "Success", 'result': data });
    } catch (error) {
        return resp.status(500).json({ "status": 500, "message": error.message, 'result': {} });
    }
}


module.exports = { UplodePhoto, CreactBlog, Myblogs, BlogByid, DeleteBlogByid, UpdateBlog, BlogsCategoryList, UplodeThumbnail };