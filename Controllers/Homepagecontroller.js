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
                                    $or: [
                                        {
                                            $and: [
                                                { $eq: ["$user_id", "$$loggedinuserid"] },
                                                { $eq: ["$blog_id", "$$blogid"] },
                                                { $eq: ["$delete", 0] },
                                                { $eq: ["$link_shared_blog_id", ""] },
                                                { $eq: ["$shared_blog_id", ""] },
                                                { $eq: ["$shared_blog_like_id", ""] },
                                            ]
                                        },
                                        {
                                            $and: [
                                                { $eq: ["$user_id", "$$loggedinuserid"] },
                                                { $eq: ["$blog_id", "$$blogid"] },
                                                { $eq: ["$delete", 0] },
                                                { $eq: [{ $type: "$link_shared_blog_id" }, "missing"] },
                                                { $eq: [{ $type: "$shared_blog_id" }, "missing"] },
                                                { $eq: [{ $type: "$shared_blog_like_id" }, "missing"] },
                                            ]
                                        }
                                    ]
                                }
                            }
                        }
                    ],
                    as: "my_total_notsharelikes"
                }
            },
            {
                $addFields: {
                    my_total_notsharelike: { $size: "$my_total_notsharelikes" }
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
            {
                $lookup: {
                    from: "comments",
                    let: { blogid: "$_id", loggedinuserid: new mongodb.ObjectId(user_id) },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $or: [
                                        {
                                            $and: [
                                                { $eq: ["$user_id", "$$loggedinuserid"] },
                                                { $eq: ["$blog_id", "$$blogid"] },
                                                { $eq: ["$delete", 0] },
                                                { $eq: ["$hide_status", 0] },
                                                { $eq: ["$link_shared_blog_id", ""] },
                                                { $eq: ["$shared_blog_id", ""] },
                                                { $eq: ["$shared_blog_comment_id", ""] },
                                            ]
                                        },
                                        {
                                            $and: [
                                                { $eq: ["$user_id", "$$loggedinuserid"] },
                                                { $eq: ["$blog_id", "$$blogid"] },
                                                { $eq: ["$delete", 0] },
                                                { $eq: ["$hide_status", 0] },
                                                { $eq: [{ $type: "$link_shared_blog_id" }, "missing"] },
                                                { $eq: [{ $type: "$shared_blog_id" }, "missing"] },
                                                { $eq: [{ $type: "$shared_blog_comment_id" }, "missing"] },
                                            ]
                                        },
                                    ]
                                }
                            }
                        }
                    ],
                    as: "my_total_notsharecomments"
                }
            },
            {
                $addFields: {
                    my_total_notsharecomment: { $size: "$my_total_notsharecomments" }
                }
            },
            {
                $lookup: {
                    from: "shares",
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
                    as: "total_share"
                }
            },
            {
                $addFields: {
                    total_shares: { $size: "$total_share" }
                }
            },
            {
                $lookup: {
                    from: "shares",
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
                    as: "my_share"
                }
            },
            {
                $addFields: {
                    my_shares: { $size: "$my_share" }
                }
            },
            {
                $addFields: {
                    main_blog_user_id_obj: {
                        $cond: {
                            if: {
                                $or: [
                                    { $eq: ["$main_blog_user_id", ""] },
                                    { $eq: ["$main_blog_user_id", null] },
                                    { $not: ["$main_blog_user_id"] }
                                ]
                            },
                            then: '',
                            else: {
                                $toObjectId: "$main_blog_user_id"
                            }
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "main_blog_user_id_obj",
                    foreignField: "_id",
                    as: "share_user_detail"
                }
            },
            { $unwind: { path: "$share_user_detail", preserveNullAndEmptyArrays: true } },
            {
                $addFields: {
                    shared_blog_id_obj: {
                        $cond: {
                            if: {
                                $or: [
                                    { $eq: ["$shared_blog_id", ""] },
                                    { $eq: ["$shared_blog_id", null] },
                                    { $not: ["$shared_blog_id"] }
                                ]
                            },
                            then: '',
                            else: {
                                $toObjectId: "$shared_blog_id"
                            }
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: "blogs",
                    localField: "shared_blog_id_obj",
                    foreignField: "_id",
                    as: "share_blog_detail"
                }
            },
            { $unwind: { path: "$share_blog_detail", preserveNullAndEmptyArrays: true } },
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
                    total_shares: 1,
                    my_shares: 1,
                    share_user_name: "$share_user_detail.name",
                    share_user_photo: "$share_user_detail.photo",
                    share_category_type: "$share_blog_detail.blog_type",
                    share_title: "$share_blog_detail.title",
                    share_sort_description: "$share_blog_detail.sort_description",
                    share_content: "$share_blog_detail.content",
                    share_photo: "$share_blog_detail.photo",
                    share_thumbnail: "$share_blog_detail.thumbnail",
                    share_content_alias: "$share_blog_detail.content_alias",
                    share_created_at: "$share_blog_detail.created_at",
                    my_total_notsharelike: 1,
                    my_total_notsharecomment: 1,

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


                let file_name1 = `${element.share_photo}`;
                let file_path1 = `${Healper.storageFolderPath()}user-blogs/${file_name1}`;
                let file_view_path1 = `${APP_STORAGE}user-blogs/${file_name1}`;
                let file_dtl1 = await Healper.FileInfo(file_name1, file_path1, file_view_path1);

                let user_file_name1 = `${element.share_user_photo}`;
                let user_file_path1 = `${Healper.storageFolderPath()}users/${user_file_name1}`;
                let user_file_view_path1 = `${APP_STORAGE}users/${user_file_name1}`;
                let user_file_dtl1 = await Healper.FileInfo(user_file_name1, user_file_path1, user_file_view_path1);

                let thumbnail_name1 = `${element.share_thumbnail}`;
                let thumbnail_path1 = `${Healper.storageFolderPath()}user-blogs/thumbnail/${thumbnail_name1}`;
                let thumbnail_view_path1 = `${APP_STORAGE}user-blogs/thumbnail/${thumbnail_name1}`;
                let thumbnail_dtl1 = await Healper.FileInfo(thumbnail_name1, thumbnail_path1, thumbnail_view_path1);

                return {
                    ...element,
                    "my_total_notsharecomment": element.my_total_notsharecomment == undefined ? 0 : element.my_total_notsharecomment,
                    "my_total_notsharelike": element.my_total_notsharelike == undefined ? 0 : element.my_total_notsharelike,
                    "share_created_at": element.share_created_at == undefined ? '' : moment(element.share_created_at).format('YYYY-MM-DD HH:mm:ss'),
                    "share_user_name": element.share_user_name == undefined ? '' : element.share_user_name,
                    "share_user_photo": element.share_user_photo == undefined ? '' : element.share_user_photo,
                    "share_category_type": element.share_category_type == undefined ? '' : element.share_category_type,
                    "share_title": element.share_title == undefined ? '' : element.share_title,
                    "share_sort_description": element.share_sort_description == undefined ? '' : element.share_sort_description,
                    "share_content": element.share_content == undefined ? '' : element.share_content,
                    "share_photo": element.share_photo == undefined ? '' : element.share_photo,
                    "share_thumbnail": element.share_thumbnail == undefined ? '' : element.share_thumbnail,
                    "share_content_alias": element.share_content_alias == undefined ? '' : element.share_content_alias,

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

                    "share_thumbnail_dtl": thumbnail_dtl1,
                    "share_user_file_dtl": user_file_dtl1,
                    "share_file_dtl": file_dtl1,
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