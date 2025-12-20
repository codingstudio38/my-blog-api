const moment = require('moment-timezone');
const BlogsModel = require('../Models/BlogsModel');
const Healper = require('./Healper');
const mongodb = require('mongodb');
const APP_STORAGE = process.env.APP_STORAGE;
async function Allblogs(req, resp) {
    try {
        let { limit = 5, page = 1 } = req.query;
        let { title = '', user_id = '', is_archive = '' } = req.body;
        let skip = 0, totalpage = 0;
        limit = parseInt(limit);
        page = parseInt(page);
        skip = (page - 1) * limit;

        let andConditions = [];
        if (title !== '') {
            andConditions.push({ title: { $regex: new RegExp(title, "i") } });
        }
        if (is_archive !== '') {
            andConditions.push({ is_archive: is_archive == 1 ? true : false });
        }
        andConditions.push({ delete: 0 });
        let query = andConditions.length > 0 ? { $and: andConditions } : {};

        // user_id
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
                }
            }
        ]);
        let total = await BlogsModel
            .find(query)
            .countDocuments();
        totalpage = Math.ceil(total / limit);
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
                    "is_shared_blog": element.is_shared_blog == undefined ? false : element.is_shared_blog,
                    "shared_blog_id": element.shared_blog_id == undefined ? false : element.shared_blog_id,
                    "is_archive": element.is_archive == undefined ? false : element.is_archive,
                    "like": element.like == undefined ? true : element.like,
                    "share": element.share == undefined ? true : element.share,
                    "comment": element.commnet == undefined ? true : element.comment,
                    "created_at": moment(element.created_at).format('YYYY-MM-DD HH:mm:ss'),
                    "updated_at": element.updated_at == null ? null : moment(element.updated_at).format('YYYY-MM-DD HH:mm:ss'),
                    "thumbnail_dtl": thumbnail_dtl,
                    "user_file_dtl": user_file_dtl,
                    "file_dtl": file_dtl,
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

module.exports = { Allblogs };