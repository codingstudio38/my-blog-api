const mongodb = require('mongodb');
const moment = require('moment-timezone');
const mongoose = require('mongoose');
const UsersModel = require('../Models/UsersModel');
const UsersFriendModel = require('../Models/UsersFriendModel');
const BlogsModel = require('../Models/BlogsModel');
const BlogsCategoryModel = require('../Models/BlogCategoryModel');
const AllNotificationsModel = require('../Models/AllNotificationsModel');
const CommentsModel = require('../Models/CommentModel');
const LikesModel = require('../Models/LikesModel');
const SharesModel = require('../Models/SharesModel');
const { clients } = require("./WebsocketController");
const Healper = require('./Healper');
const bcrypt = require("bcrypt");
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const APP_URL = process.env.APP_URL;
const APP_STORAGE = process.env.APP_STORAGE;
const blog_post_status = process.env.blog_post_status;
const new_comment = process.env.new_comment;
const new_like = process.env.new_like;
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
        let { user_id = '', title = '', content = '', photo = '', sort_description = '', blog_type = '', thumbnail = '', like = true, share = true, comment = true } = req.body;
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
        if (!fs.existsSync(`${new_blog_file_path}`)) {
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
        }
        let data = {
            user_id: user_id,
            title: title,
            content: content,
            photo: photo,
            content_alias: content_alias,
            blog_type: blog_type,
            sort_description: sort_description,
            like: like,
            share: share,
            comment: comment,
            shared_blog_id: '',
            created_at: moment().tz(process.env.TIMEZONE).format('YYYY-MM-DD HH:mm:ss'),
        };
        if (blog_type == "691beef0c2cfd41cc117ef71" || blog_type == "691beef0c2cfd41cc117ef6f" || blog_type == "691beef0c2cfd41cc117ef6e") {

        } else {
            data['thumbnail'] = '';
        }
        if (thumbnail !== '') {
            let thumbnail_file_path = `${Healper.storageFolderPath()}user-blogs/temp/user-blogs-thumbnail/user${user_id}/${thumbnail}`;
            let new_thumbnail_file_path = `${Healper.storageFolderPath()}user-blogs/thumbnail/${thumbnail}`;
            const t_path = `${Healper.storageFolderPath()}user-blogs/thumbnail`;
            if (!fs.existsSync(new_thumbnail_file_path)) {
                if (!fs.existsSync(t_path)) {
                    fs.mkdirSync(t_path, { recursive: true });
                }
                await fs.rename(thumbnail_file_path, new_thumbnail_file_path, (err) => {
                    if (err) {
                        return resp.status(200).json({ 'status': 400, 'message': 'Error moving thumbnail' });
                    }
                })
            }
            data['thumbnail'] = thumbnail;
        }

        let Blog = new BlogsModel(data);
        Blog = await Blog.save();

        let user_friends_model = new UsersFriendModel;
        let friends_list = await user_friends_model.getAllMyFriendByid(user_id);
        if (friends_list.length > 0) {
            let notify_list = [];
            friends_list.forEach((element) => {
                notify_list.push({
                    notify_toid: element.to_user_id,
                    userid: user_id,
                    requestid: element.requestid,
                    from: element.from_user_id,
                    to: element.to_user_id,
                    accept_status: 0,
                    from_user_name: element.from_user_name,
                    from_user_photo: element.from_user_photo,
                    to_user_name: element.to_user_name,
                    to_user_photo: element.to_user_photo,
                    category: blog_post_status,
                    remove_byid: Blog.content_alias,
                    blog_id: Blog._id,
                    text: Blog.title,
                    read_status: 0,
                    created_at: moment().tz(process.env.TIMEZONE).format('YYYY-MM-DD HH:mm:ss'),
                })
                if (clients[element.to_user_id]) {
                    let data = { "code": blog_post_status, "message": "new blog post", 'result': Blog._id }
                    clients[element.to_user_id].sendUTF(JSON.stringify(data));
                }
            });
            await AllNotificationsModel.insertMany(notify_list);
        }
        return resp.status(200).json({ "status": 200, "message": "Success", 'result': Blog });
    } catch (error) {
        return resp.status(500).json({ "status": 500, "message": error.message, 'result': {} });
    }
}



async function Myblogs(req, resp) {
    try {
        let { limit = 5, page = 1 } = req.query;
        let { title = '', user_id = '', blog_type = '', is_archive = '' } = req.body;
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
        if (blog_type !== '') {
            andConditions.push({ blog_type: new mongodb.ObjectId(blog_type) });
        }
        if (is_archive !== '') {
            andConditions.push({ is_archive: is_archive == 1 ? true : false });
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
            {
                $lookup: {
                    from: "likes",
                    let: { blogid: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$blog_id", "$$blogid"] },
                                        { $eq: ["$delete", 0] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: "total_like"
                }
            },
            {
                $addFields: {
                    total_likes: { $size: "$total_like" }
                }
            },
            {
                $lookup: {
                    from: "likes",
                    let: { blogid: "$_id", loggedinuserid: new mongodb.ObjectId(user_id) },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$user_id", "$$loggedinuserid"] },
                                        { $eq: ["$blog_id", "$$blogid"] },
                                        { $eq: ["$delete", 0] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: "mylike"
                }
            },
            {
                $addFields: {
                    mylike: { $size: "$mylike" }
                }
            },
            {
                $lookup: {
                    from: "comments",
                    let: { blogid: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$blog_id", "$$blogid"] },
                                        { $eq: ["$delete", 0] },
                                        { $eq: ["$hide_status", 0] },
                                    ]
                                }
                            }
                        }
                    ],
                    as: "total_comment"
                }
            },
            {
                $addFields: {
                    total_comments: { $size: "$total_comment" }
                }
            },
            {
                $lookup: {
                    from: "comments",
                    let: { blogid: "$_id", loggedinuserid: new mongodb.ObjectId(user_id) },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$user_id", "$$loggedinuserid"] },
                                        { $eq: ["$blog_id", "$$blogid"] },
                                        { $eq: ["$delete", 0] },
                                        { $eq: ["$hide_status", 0] },
                                    ]
                                }
                            }
                        }
                    ],
                    as: "my_comment"
                }
            },
            {
                $addFields: {
                    mycomment: { $size: "$my_comment" }
                }
            },
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
                    mylike: 1,
                    total_likes: 1,
                    total_comments: 1,
                    mycomment: 1,
                    user_id: 1,
                    is_shared_blog: 1,
                    shared_blog_id: 1,
                    is_archive: 1,
                    like: 1,
                    share: 1,
                    comment: 1,
                    main_blog_user_id: 1,

                }
            }
        ]);
        let total = await BlogsModel
            .find(query)
            .countDocuments();

        let resetdata_is = await Promise.all(
            list.map(async element => {
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


                return {
                    ...element,
                    "main_blog_user_id": element.main_blog_user_id == undefined ? '' : element.main_blog_user_id,
                    "is_shared_blog": element.is_shared_blog == undefined ? false : element.is_shared_blog,
                    "shared_blog_id": element.shared_blog_id == undefined ? '' : element.shared_blog_id,
                    "is_archive": element.is_archive == undefined ? false : element.is_archive,
                    "like": element.like == undefined ? true : element.like,
                    "share": element.share == undefined ? true : element.share,
                    "comment": element.comment == undefined ? true : element.comment,
                    "file_dtl": file_dtl,
                    "created_at": moment(element.created_at).format('YYYY-MM-DD HH:mm:ss'),
                    "updated_at": element.updated_at == null ? null : moment(element.updated_at).format('YYYY-MM-DD HH:mm:ss'),
                    "user_file_dtl": user_file_dtl,
                    "thumbnail_dtl": thumbnail_dtl,
                }
            })
        );
        // await filedata.then((datais) => {
        //     resetdata_is = datais;
        // }).catch((error) => {
        //     throw new Error(error);
        // });

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
                ...blog._doc,
                // "_id": blog._id,
                // "user_id": blog.user_id,
                // "title": blog.title,
                // "content": blog.content,
                // "photo": blog.photo,
                // "content_alias": blog.content_alias,
                // "active_status": blog.active_status,
                "file_dtl": file_dtl,
                "created_at": moment(blog.created_at).format('YYYY-MM-DD HH:mm:ss'),
                "updated_at": blog.updated_at == null ? null : moment(blog.updated_at).format('YYYY-MM-DD HH:mm:ss'),
                // "blog_type": blog.blog_type,
                // "sort_description": blog.sort_description,
                // "thumbnail": blog.thumbnail,
                "thumbnail_dtl": thumbnail_dtl,
                "like": blog.like,
                "share": blog.share,
                "comment": blog.comment,
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

async function BlogByAlias(req, resp) {
    try {
        let { id = '' } = req.params;
        let { user_id = '' } = req.body;
        if (!id) {
            return resp.status(200).json({ "status": 500, "message": 'id required', 'result': {} });
        }
        let list = await BlogsModel.aggregate([
            { $match: { $and: [{ content_alias: id }, { delete: 0 }] } },
            {
                $lookup: {
                    from: "users",
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
            {
                $lookup: {
                    from: "likes",
                    let: { blogid: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$blog_id", "$$blogid"] },
                                        { $eq: ["$delete", 0] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: "total_like"
                }
            },
            {
                $addFields: {
                    total_likes: { $size: "$total_like" }
                }
            },
            {
                $lookup: {
                    from: "likes",
                    let: { blogid: "$_id", loggedinuserid: new mongodb.ObjectId(user_id) },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$user_id", "$$loggedinuserid"] },
                                        { $eq: ["$blog_id", "$$blogid"] },
                                        { $eq: ["$delete", 0] },
                                    ]
                                }
                            }
                        }
                    ],
                    as: "mylike"
                }
            },
            {
                $addFields: {
                    mylike: { $size: "$mylike" }
                }
            },
            {
                $lookup: {
                    from: "comments",
                    let: { blogid: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$blog_id", "$$blogid"] },
                                        { $eq: ["$delete", 0] },
                                        { $eq: ["$hide_status", 0] },
                                    ]
                                }
                            }
                        }
                    ],
                    as: "total_comment"
                }
            },
            {
                $addFields: {
                    total_comments: { $size: "$total_comment" }
                }
            },
            {
                $lookup: {
                    from: "comments",
                    let: { blogid: "$_id", loggedinuserid: new mongodb.ObjectId(user_id) },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$user_id", "$$loggedinuserid"] },
                                        { $eq: ["$blog_id", "$$blogid"] },
                                        { $eq: ["$delete", 0] },
                                        { $eq: ["$hide_status", 0] },
                                    ]
                                }
                            }
                        }
                    ],
                    as: "my_comment"
                }
            },
            {
                $addFields: {
                    mycomment: { $size: "$my_comment" }
                }
            },
            { $sort: { _id: -1 } },
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
                    mylike: 1,
                    total_likes: 1,
                    total_comments: 1,
                    mycomment: 1,
                    user_id: 1,
                    is_shared_blog: 1,
                    shared_blog_id: 1,
                    is_archive: 1,
                    like: 1,
                    share: 1,
                    comment: 1,
                    main_blog_user_id: 1,
                }
            }
        ]);
        let blogs = await Promise.all(
            list.map(async (element) => {
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
                return {
                    ...element,
                    "main_blog_user_id": element.main_blog_user_id == undefined ? '' : element.main_blog_user_id,
                    "is_shared_blog": element.is_shared_blog == undefined ? false : element.is_shared_blog,
                    "shared_blog_id": element.shared_blog_id == undefined ? '' : element.shared_blog_id,
                    "is_archive": element.is_archive == undefined ? false : element.is_archive,
                    "like": element.like == undefined ? true : element.like,
                    "share": element.share == undefined ? true : element.share,
                    "comment": element.comment == undefined ? true : element.comment,
                    "created_at": moment(element.created_at).format('YYYY-MM-DD HH:mm:ss'),
                    "updated_at": element.updated_at == null ? null : moment(element.updated_at).format('YYYY-MM-DD HH:mm:ss'),
                    "thumbnail_dtl": thumbnail_dtl,
                    "user_file_dtl": user_file_dtl,
                    "file_dtl": file_dtl,
                }
            })
        )

        let data = {
            result: blogs,
            total: blogs.length > 0 ? 1 : 0
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
        let { id = '', user_id = '', title = '', content = '', photo = '', sort_description = '', blog_type = '', thumbnail = '', like = true, share = true, comment = true } = req.body;
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
            like: like,
            share: share,
            comment: comment,
        };

        let thumbnail_file_path = `${Healper.storageFolderPath()}user-blogs/temp/user-blogs-thumbnail/user${user_id}/${thumbnail}`;
        let new_thumbnail_file_path = `${Healper.storageFolderPath()}user-blogs/thumbnail/${thumbnail}`;

        if (thumbnail !== '') {
            const t_path = `${Healper.storageFolderPath()}user-blogs/thumbnail`;
            if (!fs.existsSync(new_thumbnail_file_path)) {
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
        }

        if (blog_type == "691beef0c2cfd41cc117ef71" || blog_type == "691beef0c2cfd41cc117ef6f" || blog_type == "691beef0c2cfd41cc117ef6e") {

        } else {
            update['thumbnail'] = '';
        }

        if (photo !== "") {
            const p_path = `${Healper.storageFolderPath()}user-blogs`;
            if (!fs.existsSync(new_blog_file_path)) {
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

async function LikeAndDislike(req, resp) {
    try {
        let { user_id = '', blog_id = '', status = 0, blog_post_by = '' } = req.body;

        if (!user_id) {
            return resp.status(200).json({ 'status': 400, 'message': 'user id required.' });
        }
        if (!blog_id) {
            return resp.status(200).json({ 'status': 400, 'message': 'blog id required.' });
        }
        if (!blog_post_by) {
            return resp.status(200).json({ 'status': 400, 'message': 'blog post by required.' });
        }
        let like = {};
        if (status == 1) {
            let data = {
                user_id: user_id,
                blog_id: blog_id,
                blog_post_by: blog_post_by,
                link_shared_blog_id: '',
                shared_blog_id: '',
                shared_blog_like_id: '',
                delete: 0,
                created_at: moment().tz(process.env.TIMEZONE).format('YYYY-MM-DD HH:mm:ss'),
            };
            let main_blog_like = await LikesModel
                .find({
                    $or: [
                        {
                            $and: [
                                { blog_id: new mongodb.ObjectId(blog_id) },
                                { user_id: new mongodb.ObjectId(user_id) },
                                { delete: 0 },
                                { link_shared_blog_id: "" },
                                { shared_blog_id: "" },
                                { shared_blog_like_id: "" },
                            ]
                        },
                        {
                            $and: [
                                { blog_id: new mongodb.ObjectId(blog_id) },
                                { user_id: new mongodb.ObjectId(user_id) },
                                { delete: 0 },
                                { $eq: [{ $type: "$link_shared_blog_id" }, "missing"] },
                                { $eq: [{ $type: "$shared_blog_id" }, "missing"] },
                                { $eq: [{ $type: "$shared_blog_like_id" }, "missing"] },
                            ]
                        },
                    ]
                })
                .countDocuments();
            if (main_blog_like <= 0) {
                like = new LikesModel(data);
                like = await like.save();
            } else {
                like = await LikesModel
                    .findOne({
                        $and: [
                            { blog_id: new mongodb.ObjectId(blog_id) },
                            { user_id: new mongodb.ObjectId(user_id) },
                            { delete: 0 },
                            { link_shared_blog_id: "" },
                            { shared_blog_id: "" },
                            { shared_blog_like_id: "" },
                        ]
                    });
            }
            let blog = new BlogsModel();
            blog = await blog.findByBlogId(blog_id);
            let obj = {}, notify_toid = '';

            if (blog !== null) {
                notify_toid = blog.user_id;
                let from = new UsersModel();
                from = await from.findByUserId(user_id);

                let to = new UsersModel();
                to = await to.findByUserId(blog.user_id);

                let UsersFriend = new UsersFriendModel();
                UsersFriend = await UsersFriend.MyFriend(user_id, notify_toid);

                obj = {
                    notify_toid: notify_toid,
                    userid: user_id,
                    requestid: UsersFriend.length > 0 ? UsersFriend[0].requestid : notify_toid,
                    from: user_id,
                    to: notify_toid,
                    accept_status: 0,
                    from_user_name: from.name,
                    from_user_photo: from.photo,
                    to_user_name: to.name,
                    to_user_photo: to.photo,
                    category: new_like,
                    remove_byid: blog.content_alias,
                    blog_id: blog._id,
                    text: blog.title,
                    comment: '',
                    read_status: 0,
                    created_at: moment().tz(process.env.TIMEZONE).format('YYYY-MM-DD HH:mm:ss'),
                }
                let notification = new AllNotificationsModel(obj);
                notification = await notification.save();
                let file_name = from.photo;
                let file_path = `${Healper.storageFolderPath()}users/${file_name}`;
                let file_view_path = `${APP_STORAGE}users/${file_name}`;
                let file_dtl = await Healper.FileInfo(file_name, file_path, file_view_path);

                let to_file_name = to.photo;
                let to_file_path = `${Healper.storageFolderPath()}users/${to_file_name}`;
                let to_file_view_path = `${APP_STORAGE}users/${to_file_name}`;
                let to_file_dtl = await Healper.FileInfo(to_file_name, to_file_path, to_file_view_path);
                let reset_notification = {
                    ...notification._doc,
                    to_user_file_view_path: to_file_dtl.file_view_path,
                    from_user_file_view_path: file_dtl.file_view_path,
                    created_at: moment(notification.created_at).format('YYYY-MM-DD HH:mm:ss'),
                };
                if (clients[notify_toid]) {
                    let data = { "code": new_like, "message": "new like", 'result': reset_notification }
                    clients[notify_toid].sendUTF(JSON.stringify(data));
                }
            }
        } else {
            like = await LikesModel.deleteOne({
                $and: [
                    { blog_id: new mongodb.ObjectId(blog_id) },
                    { user_id: new mongodb.ObjectId(user_id) },
                    { link_shared_blog_id: "" },
                    { shared_blog_id: "" },
                    { shared_blog_like_id: "" },
                ]
            });
        }
        let total = await LikesModel
            .find({
                $and: [
                    { blog_id: new mongodb.ObjectId(blog_id) },
                    { delete: 0 }
                ]
            })
            .countDocuments();
        // let total_like_on_share_post = await LikesModel
        //     .find({
        //         $or: [
        //             {
        //                 $and: [
        //                     { blog_id: new mongodb.ObjectId(blog_id) },
        //                     { delete: 0 },
        //                 ]
        //             },
        //             {
        //                 $and: [
        //                     { link_shared_blog_id: blog_id },
        //                     { delete: 0 },
        //                 ]
        //             }
        //         ]

        //     })
        //     .countDocuments();
        return resp.status(200).json({ "status": 200, "message": "Success", 'result': like, total: total});
    } catch (error) {
        return resp.status(500).json({ "status": 500, "message": error.message, 'result': {} });
    }
}

async function Comment(req, resp) {
    try {
        let { user_id = '', blog_id = '', status = 0, comment = '', comment_id = '', blog_post_by = '' } = req.body;

        if (!user_id) {
            return resp.status(200).json({ 'status': 400, 'message': 'user id required.' });
        }
        if (!blog_id) {
            return resp.status(200).json({ 'status': 400, 'message': 'blog id required.' });
        }
        if (!comment) {
            return resp.status(200).json({ 'status': 400, 'message': 'comment required.' });
        }
        if (!blog_post_by && status > 0) {
            return resp.status(200).json({ 'status': 400, 'message': 'blog post by required.' });
        }
        let insert_data = {};
        if (status == 1) {
            let data = {
                user_id: user_id,
                blog_id: blog_id,
                comment: comment,
                blog_post_by: blog_post_by,
                "shared_blog_id": '',
                "shared_blog_comment_id": '',
                "link_shared_blog_id": '',
                delete: 0,
                created_at: moment().tz(process.env.TIMEZONE).format('YYYY-MM-DD HH:mm:ss'),
            };
            insert_data = new CommentsModel(data);
            insert_data = await insert_data.save();

            let blog = new BlogsModel();
            blog = await blog.findByBlogId(blog_id);
            let obj = {}, notify_toid = '';

            if (blog !== null) {
                notify_toid = blog.user_id;
                let from = new UsersModel();
                from = await from.findByUserId(user_id);

                let to = new UsersModel();
                to = await to.findByUserId(blog.user_id);

                let UsersFriend = new UsersFriendModel();
                UsersFriend = await UsersFriend.MyFriend(user_id, notify_toid);

                obj = {
                    notify_toid: notify_toid,
                    userid: user_id,
                    requestid: UsersFriend.length > 0 ? UsersFriend[0].requestid : notify_toid,
                    from: user_id,
                    to: notify_toid,
                    accept_status: 0,
                    from_user_name: from.name,
                    from_user_photo: from.photo,
                    to_user_name: to.name,
                    to_user_photo: to.photo,
                    category: new_comment,
                    remove_byid: blog.content_alias,
                    blog_id: blog._id,
                    text: blog.title,
                    comment: comment,
                    read_status: 0,
                    created_at: moment().tz(process.env.TIMEZONE).format('YYYY-MM-DD HH:mm:ss'),
                }
                // if(UsersFriend.length > 0){
                //     obj['requestid']= UsersFriend[0].requestid;
                // }
                let notification = new AllNotificationsModel(obj);
                notification = await notification.save();
                let file_name = from.photo;
                let file_path = `${Healper.storageFolderPath()}users/${file_name}`;
                let file_view_path = `${APP_STORAGE}users/${file_name}`;
                let file_dtl = await Healper.FileInfo(file_name, file_path, file_view_path);

                let to_file_name = to.photo;
                let to_file_path = `${Healper.storageFolderPath()}users/${to_file_name}`;
                let to_file_view_path = `${APP_STORAGE}users/${to_file_name}`;
                let to_file_dtl = await Healper.FileInfo(to_file_name, to_file_path, to_file_view_path);
                let reset_notification = {
                    ...notification._doc,
                    to_user_file_view_path: to_file_dtl.file_view_path,
                    from_user_file_view_path: file_dtl.file_view_path,
                    created_at: moment(notification.created_at).format('YYYY-MM-DD HH:mm:ss'),
                };
                if (clients[notify_toid]) {
                    let data = { "code": new_comment, "message": "new comment", 'result': reset_notification }
                    clients[notify_toid].sendUTF(JSON.stringify(data));
                }
            }
        } else if (status == 2) {
            if (!comment_id) {
                return resp.status(200).json({ 'status': 400, 'message': 'comment id required.' });
            }
            if (comment_id == '') {
                return resp.status(200).json({ 'status': 400, 'message': 'comment id required.' });
            }
            let update = {
                comment: comment,
                blog_post_by: blog_post_by,
                updated_at: moment().tz(process.env.TIMEZONE).format('YYYY-MM-DD HH:mm:ss'),
            };
            insert_data = await CommentsModel.findByIdAndUpdate(
                { _id: new mongodb.ObjectId(comment_id) },
                { $set: update },
                { new: true, useFindAndModify: false }
            );

        } else {
            if (!comment_id) {
                return resp.status(200).json({ 'status': 400, 'message': 'comment id required.' });
            }
            if (comment_id == '') {
                return resp.status(200).json({ 'status': 400, 'message': 'comment id required.' });
            }
            insert_data = await CommentsModel.deleteOne({
                $and: [
                    { _id: new mongodb.ObjectId(comment_id) },
                ]
            });
        }
        if (status == 1 || status == 2) {
            let user = new UsersModel();
            user = await user.findByUserId(user_id);
            let file_name = user.photo;
            let file_path = `${Healper.storageFolderPath()}users/${file_name}`;
            let file_view_path = `${APP_STORAGE}users/${file_name}`;
            let file_dtl = await Healper.FileInfo(file_name, file_path, file_view_path);
            insert_data = {
                ...insert_data._doc,
                "shared_blog_id": insert_data._doc.shared_blog_id,
                "shared_blog_comment_id": insert_data._doc.shared_blog_comment_id,
                "link_shared_blog_id": insert_data._doc.link_shared_blog_id,
                "blog_post_by": insert_data._doc.blog_post_by,
                "user_name": user.name,
                "user_photo": user.photo,
                "user_file_view_path": file_dtl.file_view_path,
                "created_at": moment(insert_data.created_at).format('YYYY-MM-DD HH:mm:ss'),
                "updated_at": insert_data.updated_at == null ? null : moment(insert_data.updated_at).format('YYYY-MM-DD HH:mm:ss'),
            };
        }
        let total = await CommentsModel
            .find({
                $and: [
                    { blog_id: new mongodb.ObjectId(blog_id) },
                    { delete: 0 },
                    { hide_status: 0 },
                ]
            })
            .countDocuments();
        let mytotal = await CommentsModel
            .find({
                $and: [
                    { blog_id: new mongodb.ObjectId(blog_id) },
                    { user_id: new mongodb.ObjectId(user_id) },
                    { delete: 0 },
                    { hide_status: 0 },
                ]
            })
            .countDocuments();

        let my_total_notsharecomments = await CommentsModel
            .find({
                $or: [
                    {
                        blog_id: new mongodb.ObjectId(blog_id),
                        user_id: new mongodb.ObjectId(user_id),
                        delete: 0,
                        hide_status: 0,
                        link_shared_blog_id: "",
                        shared_blog_id: "",
                        shared_blog_comment_id: ""
                    },
                    {
                        blog_id: new mongodb.ObjectId(blog_id),
                        user_id: new mongodb.ObjectId(user_id),
                        delete: 0,
                        hide_status: 0,
                        link_shared_blog_id: { $exists: false },
                        shared_blog_id: { $exists: false },
                        shared_blog_comment_id: { $exists: false }
                    }
                ]

            })
            .countDocuments();

        return resp.status(200).json({ "status": 200, "message": "Success", 'result': insert_data, total: total, mytotal: mytotal, my_total_notsharecomments: my_total_notsharecomments });
    } catch (error) {
        return resp.status(500).json({ "status": 500, "message": error.message, 'result': {} });
    }
}

async function UserComment(req, resp) {
    try {
        let { user_id = '', blog_id = '' } = req.body;

        if (!user_id) {
            return resp.status(200).json({ 'status': 400, 'message': 'user id required.' });
        }
        if (!blog_id) {
            return resp.status(200).json({ 'status': 400, 'message': 'blog id required.' });
        }

        let result = await CommentsModel
            .findOne({
                $and: [
                    { user_id: new mongodb.ObjectId(user_id) },
                    { blog_id: new mongodb.ObjectId(blog_id) },
                    { delete: 0 },
                    { hide_status: 0 },
                ]
            });
        return resp.status(200).json({ "status": 200, "message": "Success", 'result': result, total: result !== null ? 1 : 0 });
    } catch (error) {
        return resp.status(500).json({ "status": 500, "message": error.message, 'result': {} });
    }
}

async function CommentList(req, resp) {
    try {
        let { limit = 5, page = 1 } = req.query;
        let { blog_id = '', user_id = '', shared_blog_id = '' } = req.body;
        let skip = 0;
        limit = parseInt(limit);
        page = parseInt(page);
        skip = (page - 1) * limit;
        if (!blog_id) {
            return resp.status(200).json({ 'status': 400, 'message': 'blog id required.' });
        }

        let andConditions = [];
        if (blog_id !== '') {
            andConditions.push({
                $and: [
                    { blog_id: new mongodb.ObjectId(blog_id) },
                    { delete: 0 },
                    { hide_status: 0 },
                ]
            });
        }
        // if (shared_blog_id !== '') {
        //     if (blog_id !== '') {
        //         andConditions.push({
        //             $and: [
        //                 { blog_id: new mongodb.ObjectId(blog_id) },
        //                 { delete: 0 },
        //                 { hide_status: 0 },
        //             ]
        //         });
        //     }
        // } else {
        //     andConditions.push({
        //         $or: [
        //             {
        //                 $and: [
        //                     { link_shared_blog_id: blog_id },
        //                     { delete: 0 },
        //                     { hide_status: 0 },
        //                 ]
        //             },
        //             {
        //                 $and: [
        //                     { blog_id: new mongodb.ObjectId(blog_id) },
        //                     { delete: 0 },
        //                     { hide_status: 0 },
        //                 ]
        //             }
        //         ]
        //     });
        // }

        let query = andConditions.length > 0 ? { andConditions } : {};


        let list = await CommentsModel.aggregate([
            {
                $match: {
                    $and: [
                        { blog_id: new mongodb.ObjectId(blog_id) },
                        { delete: 0 },
                        { hide_status: 0 },
                    ]
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "user_id",
                    foreignField: "_id",
                    as: "user_detail"
                }
            },
            { $unwind: { path: "$user_detail", preserveNullAndEmptyArrays: true } },
            { $sort: { _id: -1 } },
            { $skip: skip },
            { $limit: limit },
            {
                $project: {
                    _id: 1,
                    user_id: 1,
                    blog_id: 1,
                    comment: 1,
                    created_at: 1,
                    updated_at: 1,
                    user_name: "$user_detail.name",
                    user_photo: "$user_detail.photo",
                    blog_post_by: 1,
                    hide_status: 1,
                    shared_blog_id: 1,
                    shared_blog_comment_id: 1,
                }
            }
        ]);
        let total = await CommentsModel
            .find({
                $and: [
                    { blog_id: new mongodb.ObjectId(blog_id) },
                    { delete: 0 },
                    { hide_status: 0 }
                ]
            }).countDocuments();
        let resetdata_is = await Promise.all(
            list.map(async (element) => {
                let file_name = element.user_photo;
                let file_path = `${Healper.storageFolderPath()}users/${file_name}`;
                let file_view_path = `${APP_STORAGE}users/${file_name}`;
                let file_dtl = await Healper.FileInfo(file_name, file_path, file_view_path);
                return {
                    ...element,
                    "hide_status": element.hide_status,
                    "blog_post_by": element.blog_post_by,
                    "shared_blog_id": element.shared_blog_id,
                    "shared_blog_comment_id": element.shared_blog_comment_id,
                    "created_at": moment(element.created_at).format('YYYY-MM-DD HH:mm:ss'),
                    "updated_at": element.updated_at == null ? null : moment(element.updated_at).format('YYYY-MM-DD HH:mm:ss'),
                    "user_file_view_path": file_dtl.file_view_path,
                }
            })
        );
        let result = Healper.PaginationData(resetdata_is, total, limit, page);
        let mytotal = await CommentsModel
            .find({
                $and: [
                    { blog_id: new mongodb.ObjectId(blog_id) },
                    { user_id: new mongodb.ObjectId(user_id) },
                    { delete: 0 },
                    { hide_status: 0 },
                ]
            })
            .countDocuments();
        let total_comment_on_share_post = 0;
        if (shared_blog_id !== '') {
            total_comment_on_share_post = await CommentsModel
                .find({
                    $or: [
                        {
                            $and: [
                                { blog_id: new mongodb.ObjectId(shared_blog_id) },
                                { delete: 0 },
                                { hide_status: 0 },
                            ]
                        },
                        {
                            $and: [
                                { link_shared_blog_id: shared_blog_id },
                                { delete: 0 },
                                { hide_status: 0 },
                            ]
                        }
                    ]

                })
                .countDocuments();
        }
        return resp.status(200).json({ "status": 200, "message": "Success", 'result': result, "mytotal": mytotal, "total_comment_on_share_post": total_comment_on_share_post });
    } catch (error) {
        return resp.status(500).json({ "status": 500, "message": error.message, 'result': {} });
    }
}

async function hideComments(req, resp) {
    try {
        let { user_id = '', comment_id = '', blog_id = '' } = req.body;

        if (!user_id) {
            return resp.status(200).json({ 'status': 400, 'message': 'user id required.' });
        }
        if (!blog_id) {
            return resp.status(200).json({ 'status': 400, 'message': 'blog id required.' });
        }
        if (!comment_id) {
            return resp.status(200).json({ 'status': 400, 'message': 'comment id required.' });
        }

        let update = {
            hide_status: 1,
            updated_at: moment().tz(process.env.TIMEZONE).format('YYYY-MM-DD HH:mm:ss'),
        };
        let data = await CommentsModel.findByIdAndUpdate(
            { _id: new mongodb.ObjectId(comment_id) },
            { $set: update },
            { new: true, useFindAndModify: false }
        );
        let update2 = {
            hide_status: 1,
            updated_at: moment().tz(process.env.TIMEZONE).format('YYYY-MM-DD HH:mm:ss'),
        };
        let data2 = await CommentsModel.updateOne(
            { shared_blog_comment_id: comment_id },
            { $set: update2 },
            { new: true, useFindAndModify: false }
        );
        let total = await CommentsModel
            .find({
                $and: [
                    { blog_id: new mongodb.ObjectId(blog_id) },
                    { delete: 0 },
                    { hide_status: 0 },
                ]
            })
            .countDocuments();
        let mytotal = await CommentsModel
            .find({
                $and: [
                    { blog_id: new mongodb.ObjectId(blog_id) },
                    { user_id: new mongodb.ObjectId(user_id) },
                    { delete: 0 },
                    { hide_status: 0 },
                ]
            })
            .countDocuments();
        let total_comment_on_share_post = await CommentsModel
            .find({
                $or: [
                    {
                        $and: [
                            { blog_id: new mongodb.ObjectId(blog_id) },
                            { delete: 0 },
                            { hide_status: 0 },
                        ]
                    },
                    {
                        $and: [
                            { link_shared_blog_id: blog_id },
                            { delete: 0 },
                            { hide_status: 0 },
                        ]
                    }
                ]

            })
            .countDocuments();
        return resp.status(200).json({ "status": 200, "message": "Success", 'result': data, data2: data2, total: total, mytotal: mytotal, total_comment_on_share_post: total_comment_on_share_post });
    } catch (error) {
        return resp.status(500).json({ "status": 500, "message": error.message, 'result': {} });
    }
}


async function UpdateBlogArchive(req, resp) {
    try {
        let { status = true, blog_id = '' } = req.body;

        if (status == undefined) {
            return resp.status(200).json({ 'status': 400, 'message': 'status required.' });
        }
        if (!blog_id) {
            return resp.status(200).json({ 'status': 400, 'message': 'blog id required.' });
        }

        let update = {
            is_archive: status,
            updated_at: moment().tz(process.env.TIMEZONE).format('YYYY-MM-DD HH:mm:ss'),
        };
        data = await BlogsModel.findByIdAndUpdate(
            { _id: new mongodb.ObjectId(blog_id) },
            { $set: update },
            { new: true, useFindAndModify: false }
        );
        return resp.status(200).json({ "status": 200, "message": "Success", 'result': data });
    } catch (error) {
        return resp.status(500).json({ "status": 500, "message": error.message, 'result': {} });
    }
}


async function CommentOnSharePost(req, resp) {
    try {
        let { user_id = '', blog_id = '', shared_blog_id = '', comment = '', comment_id = '', status = '' } = req.body;

        if (!user_id) {
            return resp.status(200).json({ 'status': 400, 'message': 'user id required.' });
        }
        if (!blog_id) {
            return resp.status(200).json({ 'status': 400, 'message': 'blog id required.' });
        }
        if (!comment) {
            return resp.status(200).json({ 'status': 400, 'message': 'comment required.' });
        }
        if (!shared_blog_id) {
            return resp.status(200).json({ 'status': 400, 'message': 'shared_blog_id required.' });
        }


        let main_blog = new BlogsModel();
        main_blog = await main_blog.findByBlogId(shared_blog_id);

        let blog = new BlogsModel();
        blog = await blog.findByBlogId(blog_id);

        let insert_data = {};
        let insert_data2 = {};
        if (status == 1) {
            let data = {
                user_id: user_id,
                blog_id: blog_id,
                comment: comment,
                blog_post_by: blog.user_id,
                link_shared_blog_id: main_blog._id,
                shared_blog_id: '',
                shared_blog_comment_id: '',
                delete: 0,
                created_at: moment().tz(process.env.TIMEZONE).format('YYYY-MM-DD HH:mm:ss'),
            };
            insert_data = new CommentsModel(data);
            insert_data = await insert_data.save();

            let data2 = {
                user_id: user_id,
                blog_id: main_blog._id,
                comment: comment,
                blog_post_by: main_blog.user_id,
                link_shared_blog_id: '',
                shared_blog_id: blog_id,
                shared_blog_comment_id: insert_data._id,
                delete: 0,
                created_at: moment().tz(process.env.TIMEZONE).format('YYYY-MM-DD HH:mm:ss'),
            };
            insert_data2 = new CommentsModel(data2);
            insert_data2 = await insert_data2.save();

            //////////////////// notify to share blog post by ////////////
            let obj = {}, notify_toid = '';
            if (blog !== null) {
                notify_toid = blog.user_id;
                let from = new UsersModel();
                from = await from.findByUserId(user_id);

                let to = new UsersModel();
                to = await to.findByUserId(blog.user_id);

                let UsersFriend = new UsersFriendModel();
                UsersFriend = await UsersFriend.MyFriend(user_id, notify_toid);

                obj = {
                    notify_toid: notify_toid,
                    userid: user_id,
                    requestid: UsersFriend.length > 0 ? UsersFriend[0].requestid : notify_toid,
                    from: user_id,
                    to: notify_toid,
                    accept_status: 0,
                    from_user_name: from.name,
                    from_user_photo: from.photo,
                    to_user_name: to.name,
                    to_user_photo: to.photo,
                    category: new_comment,
                    remove_byid: blog.content_alias,
                    blog_id: blog._id,
                    text: blog.title,
                    comment: comment,
                    read_status: 0,
                    created_at: moment().tz(process.env.TIMEZONE).format('YYYY-MM-DD HH:mm:ss'),
                }

                let notification = new AllNotificationsModel(obj);
                notification = await notification.save();
                let file_name = from.photo;
                let file_path = `${Healper.storageFolderPath()}users/${file_name}`;
                let file_view_path = `${APP_STORAGE}users/${file_name}`;
                let file_dtl = await Healper.FileInfo(file_name, file_path, file_view_path);

                let to_file_name = to.photo;
                let to_file_path = `${Healper.storageFolderPath()}users/${to_file_name}`;
                let to_file_view_path = `${APP_STORAGE}users/${to_file_name}`;
                let to_file_dtl = await Healper.FileInfo(to_file_name, to_file_path, to_file_view_path);
                let reset_notification = {
                    ...notification._doc,
                    to_user_file_view_path: to_file_dtl.file_view_path,
                    from_user_file_view_path: file_dtl.file_view_path,
                    created_at: moment(notification.created_at).format('YYYY-MM-DD HH:mm:ss'),
                };
                if (clients[notify_toid]) {
                    clients[notify_toid].sendUTF(JSON.stringify({ "code": new_comment, "message": "new comment", 'result': reset_notification }));
                }
            }

            //////////////////// notify to main blog post by //////////// 
            let obj2 = {}, notify_toid2 = '';
            if (main_blog !== null) {
                notify_toid2 = main_blog.user_id;
                let from2 = new UsersModel();
                from2 = await from2.findByUserId(user_id);

                let to2 = new UsersModel();
                to2 = await to2.findByUserId(main_blog.user_id);

                let UsersFriend = new UsersFriendModel();
                UsersFriend = await UsersFriend.MyFriend(user_id, notify_toid2);

                obj2 = {
                    notify_toid: notify_toid2,
                    userid: user_id,
                    requestid: UsersFriend.length > 0 ? UsersFriend[0].requestid : notify_toid2,
                    from: user_id,
                    to: notify_toid2,
                    accept_status: 0,
                    from_user_name: from2.name,
                    from_user_photo: from2.photo,
                    to_user_name: to2.name,
                    to_user_photo: to2.photo,
                    category: new_comment,
                    remove_byid: main_blog.content_alias,
                    blog_id: main_blog._id,
                    text: main_blog.title,
                    comment: comment,
                    read_status: 0,
                    created_at: moment().tz(process.env.TIMEZONE).format('YYYY-MM-DD HH:mm:ss'),
                }

                let notification = new AllNotificationsModel(obj2);
                notification = await notification.save();
                let file_name = from2.photo;
                let file_path = `${Healper.storageFolderPath()}users/${file_name}`;
                let file_view_path = `${APP_STORAGE}users/${file_name}`;
                let file_dtl = await Healper.FileInfo(file_name, file_path, file_view_path);

                let to_file_name = to2.photo;
                let to_file_path = `${Healper.storageFolderPath()}users/${to_file_name}`;
                let to_file_view_path = `${APP_STORAGE}users/${to_file_name}`;
                let to_file_dtl = await Healper.FileInfo(to_file_name, to_file_path, to_file_view_path);
                let reset_notification = {
                    ...notification._doc,
                    to_user_file_view_path: to_file_dtl.file_view_path,
                    from_user_file_view_path: file_dtl.file_view_path,
                    created_at: moment(notification.created_at).format('YYYY-MM-DD HH:mm:ss'),
                };
                if (clients[notify_toid2]) {
                    clients[notify_toid2].sendUTF(JSON.stringify({ "code": new_comment, "message": "new comment", 'result': reset_notification }));
                }
            }
        } else if (status == 2) {
            if (!comment_id) {
                return resp.status(200).json({ 'status': 400, 'message': 'comment id required.' });
            }
            if (comment_id == '') {
                return resp.status(200).json({ 'status': 400, 'message': 'comment id required.' });
            }
            let update = {
                comment: comment,
                updated_at: moment().tz(process.env.TIMEZONE).format('YYYY-MM-DD HH:mm:ss'),
            };
            insert_data = await CommentsModel.findByIdAndUpdate(
                { _id: new mongodb.ObjectId(comment_id) },
                { $set: update },
                { new: true, useFindAndModify: false }
            );
            let update2 = {
                comment: comment,
                updated_at: moment().tz(process.env.TIMEZONE).format('YYYY-MM-DD HH:mm:ss'),
            };
            insert_data2 = await CommentsModel.updateOne(
                { shared_blog_comment_id: comment_id },
                { $set: update2 },
                { new: true, useFindAndModify: false }
            );

        } else {
            if (!comment_id) {
                return resp.status(200).json({ 'status': 400, 'message': 'comment id required.' });
            }
            if (comment_id == '') {
                return resp.status(200).json({ 'status': 400, 'message': 'comment id required.' });
            }
            insert_data = await CommentsModel.deleteOne({
                $and: [
                    { _id: new mongodb.ObjectId(comment_id) },
                ]
            });
            insert_data2 = await CommentsModel.deleteOne({
                $and: [
                    { shared_blog_comment_id: comment_id },
                ]
            });
        }
        if (status == 1 || status == 2) {
            let user = new UsersModel();
            user = await user.findByUserId(user_id);
            let file_name = user.photo;
            let file_path = `${Healper.storageFolderPath()}users/${file_name}`;
            let file_view_path = `${APP_STORAGE}users/${file_name}`;
            let file_dtl = await Healper.FileInfo(file_name, file_path, file_view_path);
            insert_data = {
                ...insert_data._doc,
                "blog_post_by": insert_data._doc.blog_post_by,
                "shared_blog_id": insert_data._doc.shared_blog_id,
                "shared_blog_comment_id": insert_data._doc.shared_blog_comment_id,
                "link_shared_blog_id": insert_data._doc.link_shared_blog_id,
                "user_name": user.name,
                "user_photo": user.photo,
                "user_file_view_path": file_dtl.file_view_path,
                "created_at": moment(insert_data.created_at).format('YYYY-MM-DD HH:mm:ss'),
                "updated_at": insert_data.updated_at == null ? null : moment(insert_data.updated_at).format('YYYY-MM-DD HH:mm:ss'),
            };
        }
        let total = await CommentsModel
            .find({
                $and: [
                    { blog_id: new mongodb.ObjectId(blog_id) },
                    { delete: 0 },
                    { hide_status: 0 },
                ]
            })
            .countDocuments();
        let mytotal = await CommentsModel
            .find({
                $and: [
                    { blog_id: new mongodb.ObjectId(blog_id) },
                    { user_id: new mongodb.ObjectId(user_id) },
                    { delete: 0 },
                    { hide_status: 0 },
                ]
            })
            .countDocuments();
        let total_comment_on_share_post = await CommentsModel
            .find({
                $or: [
                    {
                        $and: [
                            { blog_id: new mongodb.ObjectId(shared_blog_id) },
                            { delete: 0 },
                            { hide_status: 0 },
                        ]
                    },
                    {
                        $and: [
                            { link_shared_blog_id: shared_blog_id },
                            { delete: 0 },
                            { hide_status: 0 },
                        ]
                    }
                ]

            })
            .countDocuments();
        return resp.status(200).json({ "status": 200, "message": "Success", 'result': insert_data, insert_data2: insert_data2, total: total, mytotal: mytotal, total_comment_on_share_post: total_comment_on_share_post });
    } catch (error) {
        return resp.status(500).json({ "status": 500, "message": error.message, 'result': {} });
    }
}

async function LikeAndDislikeOnSharePost(req, resp) {
    try {
        let { user_id = '', blog_id = '', status = 0, shared_blog_id = '' } = req.body;

        if (!user_id) {
            return resp.status(200).json({ 'status': 400, 'message': 'user id required.' });
        }
        if (!blog_id) {
            return resp.status(200).json({ 'status': 400, 'message': 'blog id required.' });
        }
        if (!shared_blog_id) {
            return resp.status(200).json({ 'status': 400, 'message': 'shared_blog_id required.' });
        }
        let main_blog = new BlogsModel();
        main_blog = await main_blog.findByBlogId(shared_blog_id);

        let blog = new BlogsModel();
        blog = await blog.findByBlogId(blog_id);

        let like = {};
        let like2 = {};

        if (status == 1) {
            let data = {
                user_id: user_id,
                blog_id: blog_id,
                blog_post_by: blog.user_id,
                link_shared_blog_id: main_blog._id,
                shared_blog_id: '',
                shared_blog_like_id: '',
                delete: 0,
                created_at: moment().tz(process.env.TIMEZONE).format('YYYY-MM-DD HH:mm:ss'),
            };
            like = new LikesModel(data);
            like = await like.save();

            // let main_blog_like = await LikesModel
            //     .find({
            //         $or: [
            //             {
            //                 $and: [
            //                     { blog_id: new mongodb.ObjectId(blog_id) },
            //                     { user_id: new mongodb.ObjectId(user_id) },
            //                     { delete: 0 },
            //                     { link_shared_blog_id: "" },
            //                     { shared_blog_id: "" },
            //                     { shared_blog_like_id: "" },
            //                 ]
            //             },
            //             {
            //                 $and: [
            //                     { blog_id: new mongodb.ObjectId(blog_id) },
            //                     { user_id: new mongodb.ObjectId(user_id) },
            //                     { delete: 0 },
            //                     { $eq: [{ $type: "$link_shared_blog_id" }, "missing"] },
            //                     { $eq: [{ $type: "$shared_blog_id" }, "missing"] },
            //                     { $eq: [{ $type: "$shared_blog_like_id" }, "missing"] },
            //                 ]
            //             },
            //         ]
            //     })
            //     .countDocuments();
            // if (main_blog_like <= 0) { }
            let data2 = {
                user_id: user_id,
                blog_id: main_blog._id,
                blog_post_by: main_blog.user_id,
                link_shared_blog_id: '',
                shared_blog_id: blog_id,
                shared_blog_like_id: like._id,
                delete: 0,
                created_at: moment().tz(process.env.TIMEZONE).format('YYYY-MM-DD HH:mm:ss'),
            };
            like2 = new LikesModel(data2);
            like2 = await like2.save();




            let obj = {}, notify_toid = '';
            //////////////////// notify to share blog post by //////////// 
            if (blog !== null) {
                notify_toid = blog.user_id;
                let from = new UsersModel();
                from = await from.findByUserId(user_id);

                let to = new UsersModel();
                to = await to.findByUserId(blog.user_id);

                let UsersFriend = new UsersFriendModel();
                UsersFriend = await UsersFriend.MyFriend(user_id, notify_toid);

                obj = {
                    notify_toid: notify_toid,
                    userid: user_id,
                    requestid: UsersFriend.length > 0 ? UsersFriend[0].requestid : notify_toid,
                    from: user_id,
                    to: notify_toid,
                    accept_status: 0,
                    from_user_name: from.name,
                    from_user_photo: from.photo,
                    to_user_name: to.name,
                    to_user_photo: to.photo,
                    category: new_like,
                    remove_byid: blog.content_alias,
                    blog_id: blog._id,
                    text: blog.title,
                    comment: '',
                    read_status: 0,
                    created_at: moment().tz(process.env.TIMEZONE).format('YYYY-MM-DD HH:mm:ss'),
                }
                let notification = new AllNotificationsModel(obj);
                notification = await notification.save();
                let file_name = from.photo;
                let file_path = `${Healper.storageFolderPath()}users/${file_name}`;
                let file_view_path = `${APP_STORAGE}users/${file_name}`;
                let file_dtl = await Healper.FileInfo(file_name, file_path, file_view_path);

                let to_file_name = to.photo;
                let to_file_path = `${Healper.storageFolderPath()}users/${to_file_name}`;
                let to_file_view_path = `${APP_STORAGE}users/${to_file_name}`;
                let to_file_dtl = await Healper.FileInfo(to_file_name, to_file_path, to_file_view_path);
                let reset_notification = {
                    ...notification._doc,
                    to_user_file_view_path: to_file_dtl.file_view_path,
                    from_user_file_view_path: file_dtl.file_view_path,
                    created_at: moment(notification.created_at).format('YYYY-MM-DD HH:mm:ss'),
                };
                if (clients[notify_toid]) {
                    clients[notify_toid].sendUTF(JSON.stringify({ "code": new_like, "message": "new like", 'result': reset_notification }));
                }
            }

            let obj2 = {}, notify_toid2 = '';
            //////////////////// notify to main blog post by //////////// 
            if (main_blog !== null) {
                notify_toid2 = main_blog.user_id;
                let from2 = new UsersModel();
                from2 = await from2.findByUserId(user_id);

                let to2 = new UsersModel();
                to2 = await to2.findByUserId(main_blog.user_id);

                let UsersFriend = new UsersFriendModel();
                UsersFriend = await UsersFriend.MyFriend(user_id, notify_toid2);

                obj2 = {
                    notify_toid: notify_toid2,
                    userid: user_id,
                    requestid: UsersFriend.length > 0 ? UsersFriend[0].requestid : notify_toid2,
                    from: user_id,
                    to: notify_toid2,
                    accept_status: 0,
                    from_user_name: from2.name,
                    from_user_photo: from2.photo,
                    to_user_name: to2.name,
                    to_user_photo: to2.photo,
                    category: new_like,
                    remove_byid: main_blog.content_alias,
                    blog_id: main_blog._id,
                    text: main_blog.title,
                    comment: '',
                    read_status: 0,
                    created_at: moment().tz(process.env.TIMEZONE).format('YYYY-MM-DD HH:mm:ss'),
                }
                let notification = new AllNotificationsModel(obj2);
                notification = await notification.save();
                let file_name = from2.photo;
                let file_path = `${Healper.storageFolderPath()}users/${file_name}`;
                let file_view_path = `${APP_STORAGE}users/${file_name}`;
                let file_dtl = await Healper.FileInfo(file_name, file_path, file_view_path);

                let to_file_name = to2.photo;
                let to_file_path = `${Healper.storageFolderPath()}users/${to_file_name}`;
                let to_file_view_path = `${APP_STORAGE}users/${to_file_name}`;
                let to_file_dtl = await Healper.FileInfo(to_file_name, to_file_path, to_file_view_path);
                let reset_notification = {
                    ...notification._doc,
                    to_user_file_view_path: to_file_dtl.file_view_path,
                    from_user_file_view_path: file_dtl.file_view_path,
                    created_at: moment(notification.created_at).format('YYYY-MM-DD HH:mm:ss'),
                };
                if (clients[notify_toid2]) {
                    clients[notify_toid2].sendUTF(JSON.stringify({ "code": new_like, "message": "new like", 'result': reset_notification }));
                }
            }
        } else {
            const findone = await LikesModel.findOne({
                $and: [
                    { blog_id: new mongodb.ObjectId(blog_id) },
                    { user_id: new mongodb.ObjectId(user_id) },
                    { delete: 0 }
                ]
            });
            like = await LikesModel.deleteOne({
                $and: [
                    { blog_id: new mongodb.ObjectId(blog_id) },
                    { user_id: new mongodb.ObjectId(user_id) }
                ]
            });
            if (findone !== null) {
                like2 = await LikesModel.deleteOne({
                    $and: [
                        { shared_blog_like_id: findone._id },
                    ]
                });
            }
        }
        let total = await LikesModel
            .find({
                $and: [
                    { blog_id: new mongodb.ObjectId(blog_id) },
                    { delete: 0 }
                ]
            })
            .countDocuments();
        // let total_like_on_share_post = await LikesModel
        //     .find({
        //         $or: [
        //             {
        //                 $and: [
        //                     { blog_id: new mongodb.ObjectId(blog_id) },
        //                     { delete: 0 },
        //                 ]
        //             },
        //             {
        //                 $and: [
        //                     { link_shared_blog_id: blog_id },
        //                     { delete: 0 },
        //                 ]
        //             }
        //         ]

        //     })
        //     .countDocuments();
        return resp.status(200).json({ "status": 200, "message": "Success", 'result': like, total: total });
    } catch (error) {
        return resp.status(500).json({ "status": 500, "message": error.message, 'result': {} });
    }
}

async function ShareBlog(req, resp) {
    try {
        let { user_id = '', blog_id = '' } = req.body;
        if (!user_id) {
            return resp.status(200).json({ 'status': 400, 'message': 'user id required.' });
        }
        if (!blog_id) {
            return resp.status(200).json({ 'status': 400, 'message': 'blog id required.' });
        }

        let main_blog = new BlogsModel();
        main_blog = await main_blog.findByBlogId(blog_id);

        let data = {
            user_id: user_id,
            title: main_blog.title,
            content: main_blog.content,
            photo: main_blog.photo,
            content_alias: main_blog.content_alias,
            blog_type: main_blog.blog_type,
            sort_description: main_blog.sort_description,
            like: main_blog.like == undefined ? true : main_blog.like,
            share: main_blog.share == undefined ? true : main_blog.share,
            comment: main_blog.comment == undefined ? true : main_blog.comment,
            thumbnail: main_blog.thumbnail,
            is_shared_blog: true,
            shared_blog_id: main_blog._id,
            main_blog_user_id: main_blog.user_id,
            is_archive: false,
            active_status: 1,
            created_at: moment().tz(process.env.TIMEZONE).format('YYYY-MM-DD HH:mm:ss'),
        };
        let Blog = new BlogsModel(data);
        Blog = await Blog.save();

        let share = new SharesModel({
            user_id: user_id,
            blog_id: main_blog._id,
            blog_post_by: main_blog.user_id,
            created_at: moment().tz(process.env.TIMEZONE).format('YYYY-MM-DD HH:mm:ss'),
        });
        share = await share.save();

        let total_shares = await SharesModel
            .find({
                $and: [
                    { blog_id: new mongodb.ObjectId(blog_id) },
                    { delete: 0 }
                ]
            })
            .countDocuments();
        let my_shares = await SharesModel
            .find({
                $and: [
                    { blog_id: new mongodb.ObjectId(blog_id) },
                    { user_id: new mongodb.ObjectId(user_id) },
                    { delete: 0 }
                ]
            })
            .countDocuments();
        return resp.status(200).json({ "status": 200, "message": "Success", 'result': share, "blog": Blog, total_shares: total_shares, my_shares: my_shares });
    } catch (error) {
        return resp.status(500).json({ "status": 500, "message": error.message, 'result': {} });
    }
}

module.exports = { UplodePhoto, CreactBlog, Myblogs, BlogByid, DeleteBlogByid, UpdateBlog, BlogsCategoryList, UplodeThumbnail, BlogByAlias, LikeAndDislike, UserComment, Comment, CommentList, hideComments, UpdateBlogArchive, CommentOnSharePost, LikeAndDislikeOnSharePost, ShareBlog };