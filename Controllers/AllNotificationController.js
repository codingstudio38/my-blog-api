// import dotenv from "dotenv";
// dotenv.config();
import mongodb from "mongodb";
import moment from "moment-timezone";
import mongoose from "mongoose";

import AllNotificationsModel from "../Models/AllNotificationsModel.js";
import { PaginationData, generateRandomString, storageFolderPath, FileInfo, DeleteFile, FileExists, data_decrypt, data_encrypt } from "./Healper.js";

const new_friend_request = process.env.new_friend_request;
const cencel_friend_request = process.env.cencel_friend_request;
const accept_friend_request = process.env.accept_friend_request;
const reject_friend_request = process.env.reject_friend_request;
const remove_friend = process.env.remove_friend;
const APP_STORAGE = process.env.APP_STORAGE;

/* ===========================
   GET ALL NOTIFICATIONS
=========================== */
export async function AllNotifications(req, resp) {
    try {
        let { limit = 5, page = 1 } = req.query;
        let { user_id = "", blog_id = "" } = req.body;

        limit = parseInt(limit);
        page = parseInt(page);
        const skip = (page - 1) * limit;

        const andConditions = [
            { delete: 0 },
            { read_status: 0 },
            { notify_toid: new mongodb.ObjectId(user_id) },
        ];

        if (blog_id !== "") {
            andConditions.push({ blog_id: new mongodb.ObjectId(blog_id) });
        }

        const query = { $and: andConditions };

        const list = await AllNotificationsModel.aggregate([
            { $match: query },

            {
                $lookup: {
                    from: "users",
                    localField: "from",
                    foreignField: "_id",
                    as: "from_user_details",
                },
            },
            { $unwind: { path: "$from_user_details", preserveNullAndEmptyArrays: true } },

            {
                $lookup: {
                    from: "users",
                    localField: "to",
                    foreignField: "_id",
                    as: "to_user_details",
                },
            },
            { $unwind: { path: "$to_user_details", preserveNullAndEmptyArrays: true } },

            {
                $lookup: {
                    from: "blogs",
                    localField: "blog_id",
                    foreignField: "_id",
                    as: "blog_details",
                },
            },
            { $unwind: { path: "$blog_details", preserveNullAndEmptyArrays: true } },

            { $sort: { _id: -1 } },

            {
                $project: {
                    requestid: 1,
                    userid: 1,
                    notify_toid: 1,
                    to: 1,
                    from: 1,
                    accept_status: 1,
                    from_user_name: "$from_user_details.name",
                    from_user_photo: "$from_user_details.photo",
                    to_user_name: "$to_user_details.name",
                    to_user_photo: "$to_user_details.photo",
                    category: 1,
                    text: 1,
                    read_status: 1,
                    remove_byid: 1,
                    delete: 1,
                    created_at: 1,
                    updated_at: 1,
                    blog_id: 1,
                    blog_title: "$blog_details.title",
                    blog_photo: "$blog_details.photo",
                    blog_content_alias: "$blog_details.content_alias",
                    blog_thumbnail: "$blog_details.thumbnail",
                    blog_type: "$blog_details.blog_type",
                    comment: 1,
                },
            },

            { $skip: skip },
            { $limit: limit },
        ]);

        const total = await AllNotificationsModel.countDocuments(query);
        const totalpage = Math.ceil(total / limit);

        const resetdata_is = await Promise.all(
            list.map(async (element) => {
                const fromUser = await FileInfo(
                    element.from_user_photo,
                    `${storageFolderPath()}users/${element.from_user_photo}`,
                    `${APP_STORAGE}users/${element.from_user_photo}`
                );

                const toUser = await FileInfo(
                    element.to_user_photo,
                    `${storageFolderPath()}users/${element.to_user_photo}`,
                    `${APP_STORAGE}users/${element.to_user_photo}`
                );

                const blogFile = await FileInfo(
                    element.blog_photo,
                    `${storageFolderPath()}user-blogs/${element.blog_photo}`,
                    `${APP_STORAGE}user-blogs/${element.blog_photo}`
                );

                const blogThumb = await FileInfo(
                    element.blog_thumbnail,
                    `${storageFolderPath()}user-blogs/thumbnail/${element.blog_thumbnail}`,
                    `${APP_STORAGE}user-blogs/thumbnail/${element.blog_thumbnail}`
                );

                return {
                    ...element,
                    created_at: moment(element.created_at).format("YYYY-MM-DD HH:mm:ss"),
                    updated_at: element.updated_at
                        ? moment(element.updated_at).format("YYYY-MM-DD HH:mm:ss")
                        : null,
                    from_user_file_view_path: fromUser.file_view_path,
                    to_user_file_view_path: toUser.file_view_path,
                    blog_file_view_path: blogFile.file_view_path,
                    blog_thumbnail_view_path: blogThumb.file_view_path,
                    comment: element.comment ?? "",
                };
            })
        );

        return resp.status(200).json({
            status: 200,
            message: "Success",
            result: {
                list: resetdata_is,
                total,
                lastpage: totalpage,
            },
        });
    } catch (error) {
        return resp.status(500).json({
            status: 500,
            message: error.message,
            result: {},
        });
    }
}

/* ===========================
   READ SINGLE NOTIFICATION
=========================== */
export async function ReadThis(req, resp) {
    try {
        const { id = "" } = req.body;

        if (!id) {
            return resp.status(400).json({ status: 400, message: "id required" });
        }

        const updateis = await AllNotificationsModel.updateOne(
            { _id: id },
            {
                $set: {
                    read_status: 1,
                    updated_at: moment()
                        .tz(process.env.TIMEZONE)
                        .format("YYYY-MM-DD HH:mm:ss"),
                },
            }
        );

        return resp.status(200).json({
            status: 200,
            message: "Successfully updated",
            result: updateis,
        });
    } catch (error) {
        return resp.status(500).json({
            status: 500,
            message: "Failed to update",
            result: [],
        });
    }
}

/* ===========================
   CLEAR ALL NOTIFICATIONS
=========================== */
export async function ClearAll(req, resp) {
    try {
        const { user_id = "" } = req.body;

        if (!user_id) {
            return resp.status(400).json({
                status: 400,
                message: "user id required!",
                result: [],
            });
        }

        const updateis = await AllNotificationsModel.updateMany(
            { notify_toid: new mongodb.ObjectId(user_id) },
            { $set: { read_status: 1 } }
        );

        return resp.status(200).json({
            status: 200,
            message: "Successfully updated",
            result: updateis,
        });
    } catch (error) {
        return resp.status(500).json({
            status: 500,
            message: "Failed to update",
            result: [],
        });
    }
}
