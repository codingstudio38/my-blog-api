const moment = require('moment-timezone');
const BlogsModel = require('../Models/BlogsModel');
const Healper = require('./Healper');
const APP_STORAGE = process.env.APP_STORAGE;
async function Allblogs(req, resp) {
    try {
        let { limit = 5, page = 1 } = req.query;
        let { title = '', user_id = '' } = req.body;
        let skip = 0, totalpage = 0;
        limit = parseInt(limit);
        page = parseInt(page);
        skip = (page - 1) * limit;

        let andConditions = [];
        if (title !== '') {
            andConditions.push({ title: { $regex: new RegExp(title, "i") } });
        }

        andConditions.push({ delete: 0 });
        let query = andConditions.length > 0 ? { $and: andConditions } : {};

        let list = await BlogsModel.aggregate([
            { $match: query },
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
        totalpage = Math.ceil(total / limit);
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
            lastpage: totalpage
        };
        return resp.status(200).json({ "status": 200, "message": "Success", 'result': data });
    } catch (error) {
        return resp.status(500).json({ "status": 500, "message": error.message, 'result': {} });
    }
}

module.exports = { Allblogs };