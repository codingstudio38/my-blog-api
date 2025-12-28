const mongooseConnect = require('../Config/MongooseConfig');
const moment = require('moment-timezone');
const mongoose = require('mongoose');
const mongodb = require('mongodb');
const UsersChat = new mongooseConnect.Schema({
    from_user: { type: 'ObjectId', required: true, trim: true },//mongoose.Schema.Types.ObjectId
    to_user: { type: 'ObjectId', required: true, trim: true },
    message: { type: String, required: false, trim: true, default: null },
    chat_file: { type: String, required: false, trim: true, default: null },
    from_bookmark: { type: Boolean, required: false, default: false },
    to_bookmark: { type: Boolean, required: false, default: false },
    sender: { type: String, required: true, trim: true },
    read_status: { type: Number, required: false, default: 0 },
    //chat_type=0=normal chat,1=blog link,2=ifream link
    chat_type: { type: String, required: false, default: '0' },
    info: { type: String, required: false, default: '0' },
    intid: { type: Number, required: false, default: 0 },
    created_at: { type: Date, required: true, default: moment().tz(process.env.TIMEZONE).format('YYYY-MM-DD HH:mm:ss') },//Date.now()
    updated_at: { type: Date, required: false, default: null },
    delete: { type: Number, required: false, default: 0 },
});
UsersChat.methods.findBChatId = async function (chatid) {
    try {
        return await mongoose.model('users_chats').aggregate([
            {
                $match: {
                    $and: [
                        { delete: 0 },
                        { _id: new mongodb.ObjectId(chatid) },
                    ]
                },
            },
            {
                $addFields: {
                    info_obj_id: {
                        $cond: {
                            if: {
                                $or: [
                                    { $eq: ["$info", ""] },
                                    { $eq: ["$info", null] },
                                    { $eq: ["$info", '0'] },
                                    { $eq: [{ $type: "$info" }, "missing"] }
                                ]
                            },
                            then: '',
                            else: {
                                $toObjectId: "$info"
                            }
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: "blogs",
                    localField: "_id",
                    foreignField: "info_obj_id",
                    as: "blogs_detail"
                }
            },
            { $unwind: { path: "$blogs_detail", preserveNullAndEmptyArrays: true } },
            {
                $addFields: {
                    shared_blog_obj_id: {
                        $convert: {
                            input: "$blogs_detail.shared_blog_id",
                            to: "objectId",
                            onError: null,
                            onNull: null
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: "blogs",
                    localField: "shared_blog_obj_id",
                    foreignField: "_id",
                    as: "main_blog_detail"
                }
            },
            { $unwind: { path: "$main_blog_detail", preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    from_user: 1,
                    to_user: 1,
                    message: 1,
                    chat_file: 1,
                    bookmark: 1,
                    sender: 1,
                    intid: 1,
                    created_at: 1,
                    chat_type: 1,
                    info: 1,
                    'blog_title': '$blogs_detail.title',
                    'blog_type': '$blogs_detail.blog_type',
                    'blog_photo': '$blogs_detail.photo',
                    'blog_thumbnail': '$blogs_detail.thumbnail',
                    'blog_id': '$blogs_detail._id',
                    'blog_alias': '$blogs_detail.content_alias',
                    'is_shared_blog': '$blogs_detail.is_shared_blog',

                    'main_blog_title': '$main_blog_detail.title',
                    'main_blog_type': '$main_blog_detail.blog_type',
                    'main_blog_photo': '$main_blog_detail.photo',
                    'main_blog_thumbnail': '$main_blog_detail.thumbnail',
                    'main_blog_id': '$main_blog_detail._id',
                    'main_blog_alias': '$main_blog_detail.content_alias',
                    'main_is_shared_blog': '$main_blog_detail.is_shared_blog',
                },
            },
        ]);
    } catch (error) {
        throw new Error(error);
    }
}
const UsersChatModel = mongooseConnect.model('users_chats', UsersChat);
module.exports = UsersChatModel;