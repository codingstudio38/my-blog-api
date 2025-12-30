const { parentPort, workerData } = require('worker_threads');
const BlogsModel = require('../Models/BlogsModel');
const Healper = require("./Healper");
const path = require('path');
const fs = require('fs');
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");
// register ffmpeg binary
ffmpeg.setFfmpegPath(ffmpegPath);
const APP_STORAGE = process.env.APP_STORAGE;

async function doHeavyWork(reqbody) {
    try {
        let { watch = '', sec = 10 } = reqbody;
        let total = 0, data = {};
        if (!watch) return { "status": 500, "message": "video id required!", "data": false };
        if (!sec) sec = 10;
        watch = await Healper.data_decrypt(decodeURIComponent(watch));
        total = await BlogsModel.find({ 'content_alias': watch }).countDocuments();
        if (total <= 0) return { "status": 500, "message": "file not exists!!", "data": false };

        data = await BlogsModel.findOne({ 'content_alias': watch });

        let filepath = '', filedata = '', FileSize = 0, FileExists = false, FileType = '';
        filepath = path.join(__dirname, `./../storage/user-blogs/${data.photo}`);
        FileExists = await Healper.FileExists(filepath);
        if (!FileExists) return { "status": 500, "message": "file not exists!!", "data": false };

        let file_name = `${data.photo}`;
        let file_path = `${Healper.storageFolderPath()}user-blogs/${file_name}`;
        let file_view_path = `${APP_STORAGE}user-blogs/video-thumbnails${data._id}/`;

        const video = file_path;
        const output = `${Healper.storageFolderPath()}user-blogs/video-thumbnails${data._id}/`;

        let file_new_name = `${sec}.jpg`;
        let file_full_path_name = `${output}${file_new_name}`;
        let file_full_view_name = `${file_view_path}${file_new_name}`;

        if (!fs.existsSync(output)) {
            fs.mkdirSync(output, { recursive: true });
        }

        // generate single image from video file
        const thumlist = new Promise((resolve, reject) => {
            if (fs.existsSync(`${file_full_path_name}`)) {
                fs.unlinkSync(`${file_full_path_name}`);
            }
            ffmpeg(video)
                .screenshots({
                    count: 1,
                    timemarks: [sec.toString()],
                    filename: file_new_name,
                    folder: output,
                })
                .on("end", () => {
                    resolve({
                        time: sec,
                        thumbnail: file_full_view_name,
                    });
                })
                .on("error", (err) => {
                    reject(err)
                });
        });
        let thumbs = {};
        let thumbsbase64 = '';
        // aftter generated image file get the image data
        await thumlist.then(data => { thumbs = data; }).catch(err => { throw err; });
        const mime = 'image/jpeg';

        // convert in base64 data
        const thuminbase64 = new Promise((resolve, reject) => {
            fs.readFile(file_full_path_name, (err, data) => {
                if (err) reject(err);
                if (data == undefined) { reject('File data is undefined'); }
                resolve(data.toString("base64"));
            });
        });
        await thuminbase64.then(data => { thumbsbase64 = `data:${mime};base64,${data}`; }).catch(err => { throw err; });

        // delete file after generate base64 data
        if (fs.existsSync(`${file_full_path_name}`)) {
            fs.unlinkSync(`${file_full_path_name}`);
        }
        return { status: 200, thumbsbase64: thumbsbase64 };
    } catch (error) {
        return { status: 500, "message": error.message, "data": false};
        // throw new Error(error);
        // throw error;
    }
}
doHeavyWork(workerData.reqbody).then((data) => parentPort.postMessage(data)).catch((err) => parentPort.postMessage(err));