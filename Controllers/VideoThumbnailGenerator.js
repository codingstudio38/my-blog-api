// import dotenv from "dotenv";
// dotenv.config();
import { parentPort, workerData } from "worker_threads";
import BlogsModel from "../Models/BlogsModel.js";
import { PaginationData, generateRandomString, storageFolderPath, FileInfo, DeleteFile, FileExists, data_decrypt, data_encrypt } from "./Healper.js";
import path from "path";
import fs from "fs";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import { fileURLToPath } from "url";

// register ffmpeg binary
ffmpeg.setFfmpegPath(ffmpegPath);

const APP_STORAGE = process.env.APP_STORAGE;

// __dirname replacement for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function doHeavyWork(reqbody) {
    try {
        let { watch = "", sec = 10 } = reqbody;
        let total = 0;
        let data = {};

        if (!watch) {
            return { status: 500, message: "video id required!", data: false };
        }

        if (!sec) sec = 10;

        watch = await data_decrypt(decodeURIComponent(watch));

        total = await BlogsModel.find({ content_alias: watch }).countDocuments();
        if (total <= 0) {
            return { status: 500, message: "file not exists!!", data: false };
        }

        data = await BlogsModel.findOne({ content_alias: watch });

        const filepath = path.join(
            __dirname,
            `../storage/user-blogs/${data.photo}`
        );

        const fileExists = await FileExists(filepath);
        if (!fileExists) {
            return { status: 500, message: "file not exists!!", data: false };
        }

        const file_name = data.photo;
        const file_path = `${storageFolderPath()}user-blogs/${file_name}`;
        const file_view_path = `${APP_STORAGE}user-blogs/video-thumbnails${data._id}/`;

        const video = file_path;
        const output = `${storageFolderPath()}user-blogs/video-thumbnails${data._id}/`;

        const file_new_name = `${sec}.jpg`;
        const file_full_path_name = `${output}${file_new_name}`;
        const file_full_view_name = `${file_view_path}${file_new_name}`;

        if (!fs.existsSync(output)) {
            fs.mkdirSync(output, { recursive: true });
        }

        // generate thumbnail
        await new Promise((resolve, reject) => {
            if (fs.existsSync(file_full_path_name)) {
                fs.unlinkSync(file_full_path_name);
            }

            ffmpeg(video)
                .screenshots({
                    count: 1,
                    timemarks: [sec.toString()],
                    filename: file_new_name,
                    folder: output,
                })
                .on("end", resolve)
                .on("error", reject);
        });

        const mime = "image/jpeg";

        // convert to base64
        const base64Data = await new Promise((resolve, reject) => {
            fs.readFile(file_full_path_name, (err, data) => {
                if (err) return reject(err);
                resolve(data.toString("base64"));
            });
        });

        // delete temp thumbnail
        if (fs.existsSync(file_full_path_name)) {
            fs.unlinkSync(file_full_path_name);
        }

        return {
            status: 200,
            thumbsbase64: `data:${mime};base64,${base64Data}`,
        };
    } catch (error) {
        return { status: 500, message: error.message, data: false };
    }
}

doHeavyWork(workerData.reqbody)
    .then((data) => parentPort.postMessage(data))
    .catch((err) => parentPort.postMessage(err));
