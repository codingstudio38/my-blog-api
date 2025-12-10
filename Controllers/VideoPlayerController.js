const BlogsModel = require('../Models/BlogsModel');
const path = require('path');
const fs = require('fs');
const mongodb = require('mongodb');
const Healper = require("./Healper");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");
// register ffmpeg binary
ffmpeg.setFfmpegPath(ffmpegPath);
const APP_STORAGE = process.env.APP_STORAGE;
async function NodeJSStreams(req, resp) {
    try {
        let { watch } = req.query;
        let total = 0, data = {};
        if (!watch) return resp.status(500).json({ "status": 500, "message": "video id required!", "data": false });
        watch = await Healper.data_decrypt(decodeURIComponent(watch));
        total = await BlogsModel.find({ 'content_alias': watch }).countDocuments();
        if (total <= 0) return resp.status(500).json({ "status": 500, "message": "file not exists!!", "data": false });
        data = await BlogsModel.findOne({ 'content_alias': watch });
        let filepath = '', filedata = '', FileSize = 0, FileExists = false, FileType = '';
        filepath = `${Healper.storageFolderPath()}user-blogs/${data.photo}`;
        FileExists = await Healper.FileExists(filepath);
        if (!FileExists) return resp.status(500).json({ "status": 500, "message": "file not exists!!", "data": false });
        let file_name = `${data.photo}`;
        let file_path = `${Healper.storageFolderPath()}user-blogs/${file_name}`;
        let file_view_path = `${APP_STORAGE}user-blogs/${file_name}`;
        const getFileInfo = await Healper.FileInfo(file_name, file_path, file_view_path);
        FileSize = getFileInfo.filesize;
        FileType = getFileInfo.filetype;
        let range = req.headers.range;
        if (!range) return resp.status(500).json({ "status": 500, "message": 'headers range required!', "data": false });

        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : FileSize - 1;

        const chunkSize = end - start + 1;
        const file = fs.createReadStream(filepath, { start, end });

        const head = {
            "Content-Range": `bytes ${start}-${end}/${FileSize}`,
            "Accept-Ranges": "bytes",
            "Content-Length": chunkSize,
            "Content-Type": "video/mp4"
        };

        resp.writeHead(206, head);
        file.pipe(resp);

    } catch (error) {
        return resp.status(500).json({ "status": 500, "message": error.message, "data": false });
    }
}

async function NodeJSStreams_OLD(req, resp) {
    try {
        let { watch } = req.query;
        let total = 0, data = {};
        if (!watch) return resp.status(500).json({ "status": 500, "message": "video id required!", "data": false });

        watch = await Healper.data_decrypt(decodeURIComponent(watch)); //Healper.data_encrypt()
        total = await BlogsModel.find({ 'content_alias': watch }).countDocuments();
        if (total <= 0) return resp.status(500).json({ "status": 500, "message": "file not exists!!", "data": false });
        data = await BlogsModel.findOne({ 'content_alias': watch });
        let filepath = '', filedata = '', FileSize = 0, FileExists = false, FileType = '';
        filepath = path.join(__dirname, `./../storage/user-blogs/${data.photo}`);
        FileExists = await Healper.FileExists(filepath);
        if (!FileExists) return resp.status(500).json({ "status": 500, "message": "file not exists!!", "data": false });
        let file_name = `${data.photo}`;
        let file_path = `${Healper.storageFolderPath()}user-blogs/${file_name}`;
        let file_view_path = `${APP_STORAGE}user-blogs/${file_name}`;
        const getFileInfo = await Healper.FileInfo(file_name, file_path, file_view_path);
        FileSize = getFileInfo.filesize;
        FileType = getFileInfo.filetype;
        let range = req.headers.range;
        if (!range) return resp.status(500).json({ "status": 500, "message": 'headers range required!', "data": false });
        const CHUNK_SIZE = 10 ** 6; // 1MB chunk size
        const start = Number(range.replace(/\D/g, ""));
        const end = Math.min(start + CHUNK_SIZE, FileSize - 1);

        const contentLength = end - start + 1;
        const headers = {
            'Content-Range': `bytes ${start}-${end}/${FileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': contentLength,
            'Content-Type': 'video/mp4',
        };

        // Respond with the 206 Partial Content status
        resp.writeHead(206, headers);
        // Create a stream to read the video file chunk
        const videoStream = fs.createReadStream(filepath, { start, end });
        // Pipe the video stream to the response
        videoStream.pipe(resp);
    } catch (error) {
        return resp.status(500).json({ "status": 500, "message": error.message, "data": false });
    }
}
async function Videothumbnail(req, resp) {
    /// 1->npm install fluent-ffmpeg
    // 1->npm install ffmpeg-static
    // 2->https://www.gyan.dev/ffmpeg/builds/,https://github.com/GyanD/codexffmpeg/releases/tag/2025-12-07-git-c4d22f2d2c
    // 2.a->ffmpeg-2025-12-07-git-c4d22f2d2c-full_build.zip
    // 2.b->Extract and copy bin folder path
    // 2.c->Set Environment variable in system settings
    // 3->Restart VS code or system
    try {
        let { watch = '', sec = 10 } = req.body;
        let total = 0, data = {};
        if (!watch) return resp.status(500).json({ "status": 500, "message": "video id required!", "data": false });
        if (!sec) sec = 10;
        watch = await Healper.data_decrypt(decodeURIComponent(watch)); //Healper.data_encrypt()
        total = await BlogsModel.find({ 'content_alias': watch }).countDocuments();
        if (total <= 0) return resp.status(500).json({ "status": 500, "message": "file not exists!!", "data": false });
        data = await BlogsModel.findOne({ 'content_alias': watch });
        let filepath = '', filedata = '', FileSize = 0, FileExists = false, FileType = '';
        filepath = path.join(__dirname, `./../storage/user-blogs/${data.photo}`);
        FileExists = await Healper.FileExists(filepath);
        if (!FileExists) return resp.status(500).json({ "status": 500, "message": "file not exists!!", "data": false });
        let file_name = `${data.photo}`;
        let file_path = `${Healper.storageFolderPath()}user-blogs/${file_name}`;
        let file_view_path = `${APP_STORAGE}user-blogs/video-thumbnails${data._id}/`;
        const video = file_path;
        const output = `${Healper.storageFolderPath()}user-blogs/video-thumbnails${data._id}/`;
        let file_new_name = `${sec}.jpg`;
        let file_full_path_name = `${output}${file_new_name}`;
        let file_full_view_name = `${file_view_path}${file_new_name}`;
        const interval = 1; // seconds
        if (!fs.existsSync(output)) {
            fs.mkdirSync(output, { recursive: true });
        }
        const thumlist = new Promise((resolve, reject) => {
            // singel thumbnail generation
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

            // Uncomment below code to generate multiple thumbnails at specified intervals
            // ffmpeg(video)
            // .on("end", () => {
            //     const files = fs.readdirSync(output);
            //     // Build dynamic thumbnail object
            //     let thumbs = {};
            //     let current = 0;
            //     files.forEach((file) => {
            //         thumbs[current] = `${file_view_path}${file}`;
            //         current += interval;
            //     });
            //     resolve(thumbs);
            // })
            // .on("error", reject)
            // .screenshots({
            //     count: 10, // number of thumbnails
            //     folder: output,
            //     filename: "%s.jpg",
            //     timemarks: Array.from({ length: 10 }, (_, i) => `${i * interval}`),
            // });
        });
        let thumbs = {};
        let thumbsbase64 = '';
        await thumlist.then(data => { console.clear(); console.log(data); thumbs = data; }).catch(err => { throw err; });
        const mime = 'image/jpeg';

        // const file = fs.readFileSync(file_full_path_name).toString("base64");
        // thumbsbase64= `data:${mime};base64,${file}`;

        const thuminbase64 = new Promise((resolve, reject) => {
            fs.readFile(file_full_path_name, (err, data) => {
                if (err) reject(err);
                console.clear();
                console.log(data);
                // console.log(data==undefined);
                if (data == undefined) { reject('File data is undefined'); }
                resolve(data.toString("base64"));
            });
        });
        await thuminbase64.then(data => { thumbsbase64 = `data:${mime};base64,${data}`; }).catch(err => { throw err; });
        if (fs.existsSync(`${file_full_path_name}`)) {
            fs.unlinkSync(`${file_full_path_name}`);
        }
        resp.status(200).json({ status: 200, thumbsbase64: thumbsbase64 });
    } catch (err) {
        resp.status(500).json({ error: err.message });
    }
}
module.exports = { NodeJSStreams, NodeJSStreams_OLD, Videothumbnail };
