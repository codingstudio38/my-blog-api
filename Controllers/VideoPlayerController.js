const BlogsModel = require('../Models/BlogsModel');
const path = require('path');
const fs = require('fs');
const mongodb = require('mongodb');
const Healper = require("./Healper");
const APP_STORAGE = process.env.APP_STORAGE;
async function NodeJSStreams(req, resp) {
    try {
        let { watch } = req.query;
        let total = 0, data = {};
        if (!watch) return resp.status(200).json({ "status": 200, "message": "video id required!", "data": false });
        watch = await Healper.data_decrypt(decodeURIComponent(watch));
        total = await BlogsModel.find({ 'content_alias': watch }).countDocuments();
        if (total <= 0) return resp.status(200).json({ "status": 200, "message": "file not exists!!", "data": false });
        data = await BlogsModel.findOne({ 'content_alias': watch });
        let filepath = '', filedata = '', FileSize = 0, FileExists = false, FileType = '';
        filepath = `${Healper.storageFolderPath()}user-blogs/${data.photo}`;
        FileExists = await Healper.FileExists(filepath);
        if (!FileExists) return resp.status(200).json({ "status": 200, "message": "file not exists!!", "data": false });
        let file_name = `${data.photo}`;
        let file_path = `${Healper.storageFolderPath()}user-blogs/${file_name}`;
        let file_view_path = `${APP_STORAGE}user-blogs/${file_name}`;
        const getFileInfo = await Healper.FileInfo(file_name, file_path, file_view_path);
        FileSize = getFileInfo.filesize;
        FileType = getFileInfo.filetype;
        let range = req.headers.range;
        if (!range) return resp.status(416).json({ "status": 416, "message": 'headers range required!', "data": false });

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
        if (!watch) return resp.status(200).json({ "status": 200, "message": "video id required!", "data": false });

        watch = await Healper.data_decrypt(decodeURIComponent(watch)); //Healper.data_encrypt()
        total = await BlogsModel.find({ 'content_alias': watch }).countDocuments();
        if (total <= 0) return resp.status(200).json({ "status": 200, "message": "file not exists!!", "data": false });
        data = await BlogsModel.findOne({ 'content_alias': watch });
        let filepath = '', filedata = '', FileSize = 0, FileExists = false, FileType = '';
        filepath = path.join(__dirname, `./../storage/user-blogs/${data.photo}`);
        FileExists = await Healper.FileExists(filepath);
        if (!FileExists) return resp.status(200).json({ "status": 200, "message": "file not exists!!", "data": false });
        let file_name = `${data.photo}`;
        let file_path = `${Healper.storageFolderPath()}user-blogs/${file_name}`;
        let file_view_path = `${APP_STORAGE}user-blogs/${file_name}`;
        const getFileInfo = await Healper.FileInfo(file_name, file_path, file_view_path);
        FileSize = getFileInfo.filesize;
        FileType = getFileInfo.filetype;
        let range = req.headers.range;
        if (!range) return resp.status(200).json({ "status": 200, "message": 'headers range required!', "data": false });
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

module.exports = { NodeJSStreams, NodeJSStreams_OLD };
