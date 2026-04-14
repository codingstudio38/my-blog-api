// import dotenv from "dotenv";
// dotenv.config();
import BlogsModel from "../Models/BlogsModel.js";
import path from "path";
import fs from "fs";
import mongodb from "mongodb";
import { PaginationData, generateRandomString, storageFolderPath, FileInfo, DeleteFile, FileExists, data_decrypt, data_encrypt } from "./Healper.js";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import { Worker } from "worker_threads";
import { fileURLToPath } from "url";
import { dirname } from "path";
import crypto from "crypto";
import moment from "moment-timezone";
import { set } from "mongoose";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const APP_STORAGE = process.env.APP_STORAGE;

// register ffmpeg binary
ffmpeg.setFfmpegPath(ffmpegPath);



export async function NodeJSStreams(req, resp) {
    try {
        let { watch } = req.query;
        let total = 0, data = {};
        if (!watch) return resp.status(500).json({ "status": 500, "message": "video id required!", "data": false });
        watch = await data_decrypt(decodeURIComponent(watch));
        total = await BlogsModel.find({ 'content_alias': watch }).countDocuments();
        if (total <= 0) return resp.status(500).json({ "status": 500, "message": "file not exists!!", "data": false });
        data = await BlogsModel.findOne({ 'content_alias': watch });
        let filepath = '', filedata = '', FileSize = 0, FileExists_ = false, FileType = '';
        filepath = `${storageFolderPath()}user-blogs/${data.photo}`;
        FileExists_ = await FileExists(filepath);
        if (!FileExists_) return resp.status(500).json({ "status": 500, "message": "file not exists!!", "data": false });
        let file_name = `${data.photo}`;
        let file_path = `${storageFolderPath()}user-blogs/${file_name}`;
        let file_view_path = `${APP_STORAGE}user-blogs/${file_name}`;
        const getFileInfo = await FileInfo(file_name, file_path, file_view_path);
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

export async function NodeJSStreams_OLD(req, resp) {
    try {
        let { watch } = req.query;
        let total = 0, data = {};
        if (!watch) return resp.status(500).json({ "status": 500, "message": "video id required!", "data": false });

        watch = await data_decrypt(decodeURIComponent(watch)); //data_encrypt()
        total = await BlogsModel.find({ 'content_alias': watch }).countDocuments();
        if (total <= 0) return resp.status(500).json({ "status": 500, "message": "file not exists!!", "data": false });
        data = await BlogsModel.findOne({ 'content_alias': watch });
        let filepath = '', filedata = '', FileSize = 0, FileExists_ = false, FileType = '';
        filepath = path.join(__dirname, `./../storage/user-blogs/${data.photo}`);
        FileExists_ = await FileExists(filepath);
        if (!FileExists_) return resp.status(500).json({ "status": 500, "message": "file not exists!!", "data": false });
        let file_name = `${data.photo}`;
        let file_path = `${storageFolderPath()}user-blogs/${file_name}`;
        let file_view_path = `${APP_STORAGE}user-blogs/${file_name}`;
        const getFileInfo = await FileInfo(file_name, file_path, file_view_path);
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
        console.log(error.message);
        return resp.status(500).json({ "status": 500, "message": error.message, "data": false });
    }
}
export async function Videothumbnail(req, resp) {
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
        watch = await data_decrypt(decodeURIComponent(watch)); //data_encrypt()
        total = await BlogsModel.find({ 'content_alias': watch }).countDocuments();
        if (total <= 0) return resp.status(500).json({ "status": 500, "message": "file not exists!!", "data": false });
        data = await BlogsModel.findOne({ 'content_alias': watch });
        let filepath = '', filedata = '', FileSize = 0, FileExists_ = false, FileType = '';
        filepath = path.join(__dirname, `./../storage/user-blogs/${data.photo}`);
        FileExists_ = await FileExists(filepath);
        if (!FileExists_) return resp.status(500).json({ "status": 500, "message": "file not exists!!", "data": false });
        let file_name = `${data.photo}`;
        let file_path = `${storageFolderPath()}user-blogs/${file_name}`;
        let file_view_path = `${APP_STORAGE}user-blogs/video-thumbnails${data._id}/`;
        const video = file_path;
        const output = `${storageFolderPath()}user-blogs/video-thumbnails${data._id}/`;
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
        await thumlist.then(data => {
            // console.clear(); console.log(data); 
            thumbs = data;
        }).catch(err => { throw err; });
        const mime = 'image/jpeg';

        // const file = fs.readFileSync(file_full_path_name).toString("base64");
        // thumbsbase64= `data:${mime};base64,${file}`;

        const thuminbase64 = new Promise((resolve, reject) => {
            fs.readFile(file_full_path_name, (err, data) => {
                if (err) reject(err);
                console.clear();
                // console.log(data);
                // console.log(data==undefined);
                if (data == undefined) { reject('File data is undefined'); }
                resolve(data.toString("base64"));
            });
        });
        await thuminbase64.then(data => { thumbsbase64 = `data:${mime};base64,${data}`; }).catch(err => { throw err; });
        if (fs.existsSync(`${file_full_path_name}`)) {
            fs.unlinkSync(`${file_full_path_name}`);
        }
        return resp.status(200).json({ status: 200, thumbsbase64: thumbsbase64 });
    } catch (err) {
        return resp.status(500).json({ error: err.message });
    }
}

export async function VideothumbnailNew(req, resp) {
    /// 1->npm install fluent-ffmpeg
    // 1->npm install ffmpeg-static
    // 2->https://www.gyan.dev/ffmpeg/builds/,https://github.com/GyanD/codexffmpeg/releases/tag/2025-12-07-git-c4d22f2d2c
    // 2.a->ffmpeg-2025-12-07-git-c4d22f2d2c-full_build.zip
    // 2.b->Extract and copy bin folder path
    // 2.c->Set Environment variable in system settings
    // 3->Restart VS code or system
    try {
        let { watch = '', sec = 10 } = req.body;
        const ThumbnailGenerator = new Worker(
            path.join(__dirname, "VideoThumbnailGenerator.js"),
            {
                workerData: {
                    reqbody: req.body,
                }
            });
        ThumbnailGenerator.on("message", (data) => {
            return resp.status(200).json(data);
        });
        ThumbnailGenerator.on("error", (e) => {
            throw new Error(e);
        });
    } catch (err) {
        return resp.status(500).json({ error: err.message });
    }
}

export async function generateThumbnails(video, output) {
    try {
        await new Promise((resolve, reject) => {
            ffmpeg(video)
                .output(`${output}/thumb_%04d.jpg`)
                .outputOptions([
                    '-vf fps=1',       // 1 thumbnail per second
                    // '-qscale:v 2'
                ])
                .on('end', resolve)
                .on('error', reject)
                .run();
        });
        return true;
    } catch (error) {
        throw new Error(error);
    }
}

export async function generateSprite(video, output, blog) {
    try {
        const
            thumbWidth = 160,
            thumbHeight = 90,
            interval = 1,
            spriteUrl = `${APP_STORAGE}user-blogs/video-thumbnails${blog._id}/sprite.jpg`;
        ;
        const thumbs = fs.readdirSync(output).filter(f => f.startsWith('thumb_') && f.endsWith('.jpg'));
        if (!thumbs.length) {
            throw new Error('No thumbnails found to generate sprite');
        }
        const count = thumbs.length;

        const cols = Math.ceil(Math.sqrt(count));
        const rows = Math.ceil(count / cols);
        await new Promise((resolve, reject) => {
            ffmpeg()
                .input(path.join(output, 'thumb_%04d.jpg'))
                .inputOptions([
                    '-pattern_type sequence',
                    '-framerate 1'
                ])
                .outputOptions([
                    `-vf scale=${thumbWidth}:${thumbHeight},tile=${cols}x${rows}`,
                    '-frames:v 1'
                    // '-qscale:v 2'
                ])
                .output(path.join(output, 'sprite.jpg'))
                .on('end', resolve)
                .on('error', reject)
                .run();
        });
        // Generate metadata
        const frames = {};
        for (let i = 0; i < count; i++) {
            const col = i % cols;
            const row = Math.floor(i / cols);

            frames[i] = {
                x: -(col * thumbWidth),
                y: -(row * thumbHeight)
            };
        }

        const metadata = {
            thumbWidth,
            thumbHeight,
            interval,
            columns: cols,
            rows,
            count,
            spriteUrl,
            frames
        };
        fs.writeFileSync(path.join(output, 'sprite.json'), JSON.stringify(metadata, null, 2));
        thumbs.forEach((files) => {
            let f = `${output}/${files}`;
            if (fs.existsSync(f)) {
                fs.unlinkSync(f);
            }
        })
        return metadata;
    } catch (error) {
        throw new Error(error);
    }
}

export async function VideothumbnailMetaData(req, resp) {
    try {
        let { watch = '' } = req.body;
        let sec = 2, total = 0, data = {};
        if (!sec) sec = 2;
        if (!watch) resp.status(200).json({ "status": 500, "message": "blog id requird", "data": false });
        watch = await data_decrypt(decodeURIComponent(watch));
        total = await BlogsModel.find({ 'content_alias': watch }).countDocuments();
        if (total <= 0) return resp.status(200).json({ "status": 500, "message": "file not exists!!", "data": false });
        data = await BlogsModel.findOne({ 'content_alias': watch });
        const filepath = `${storageFolderPath()}user-blogs/video-thumbnails${data._id}/sprites.json`;
        let FileExists_ = await FileExists(filepath);
        if (!FileExists_) return resp.status(200).json({ "status": 500, "message": "file not exists!!", "result": {} });

        const stream = await fs.readFileSync(filepath, 'utf8');
        return resp.status(200).json({ status: 200, result: JSON.parse(stream) });

    } catch (err) {
        return resp.status(500).json({ status: 500, message: err.message });
    }
}



export async function VideothumbnailV2(req, resp) {
    /// 1->npm install fluent-ffmpeg
    // 1->npm install ffmpeg-static
    // 2->https://www.gyan.dev/ffmpeg/builds/,https://github.com/GyanD/codexffmpeg/releases/tag/2025-12-07-git-c4d22f2d2c
    // 2.a->ffmpeg-2025-12-07-git-c4d22f2d2c-full_build.zip
    // 2.b->Extract and copy bin folder path
    // 2.c->Set Environment variable in system settings
    // 3->Restart VS code or system
    //http://192.168.61.155:5000/video-thumbnail-v2?watch=TJFzv7%2FNJ2JC7fSq7SMEmw%3D%3D
    try {
        let { watch = '' } = req.query;
        let sec = 2, total = 0, data = {};
        if (!sec) sec = 2;
        if (!watch) resp.status(500).json({ "status": 500, "message": "blog id requird", "data": false });
        watch = await data_decrypt(decodeURIComponent(watch)); //data_encrypt()
        total = await BlogsModel.find({ 'content_alias': watch }).countDocuments();
        if (total <= 0) return resp.status(500).json({ "status": 500, "message": "file not exists!!", "data": false });
        data = await BlogsModel.findOne({ 'content_alias': watch });
        let filepath = '', filedata = '', FileSize = 0, FileExists_ = false, FileType = '';
        filepath = path.join(__dirname, `./../storage/user-blogs/${data.photo}`);
        FileExists_ = await FileExists(filepath);
        if (!FileExists_) return resp.status(500).json({ "status": 500, "message": "file not exists!!", "data": false });
        let file_name = `${data.photo}`;
        let file_path = `${storageFolderPath()}user-blogs/${file_name}`;

        const video = file_path;
        const output = `${storageFolderPath()}user-blogs/video-thumbnails${data._id}`;

        if (!fs.existsSync(output)) {
            fs.mkdirSync(output, { recursive: true });
        }
        // STEP 1: thumbnails
        await new Promise((resolve, reject) => {
            ffmpeg(video)
                .output(`${output}/thumb_%04d.jpg`)
                .outputOptions([
                    '-vf fps=1',       // 1 thumbnail per second
                    // '-qscale:v 2'
                ])
                .on('end', resolve)
                .on('error', reject)
                .run();
        });

        // STEP 2: sprite
        const spritesheet = await generateMultipleSprite(video, output, data);


        return resp.status(200).json({ status: 200, result: spritesheet });
    } catch (err) {
        return resp.status(500).json({ error: err.message });
    }
}
export async function generateMultipleSprite(video, output, blog) {
    const thumbWidth = 160;
    const thumbHeight = 90;
    const interval = 1;
    let THUMBS_PER_SPRITE = 100;
    const COLS = 10;
    const ROWS = 10;

    const thumbs = fs
        .readdirSync(output)
        .filter(f => f.startsWith('thumb_') && f.endsWith('.jpg'))
        .sort();
    const count = thumbs.length;
    if (!thumbs.length) {
        throw new Error('No thumbnails found');
    }
    const sprites = [];
    THUMBS_PER_SPRITE = thumbs.length >= THUMBS_PER_SPRITE ? THUMBS_PER_SPRITE : Math.ceil(thumbs.length);
    const totalSprites = Math.ceil(thumbs.length / THUMBS_PER_SPRITE);
    for (let s = 0; s < totalSprites; s++) {
        const start = s * THUMBS_PER_SPRITE;
        const end = start + THUMBS_PER_SPRITE;
        const chunk = thumbs.slice(start, end);

        // temp list file (ffmpeg concat trick)
        const listFile = path.join(output, `list_${s}.txt`);
        fs.writeFileSync(
            listFile,
            chunk.map(f => `file '${path.join(output, f)}'`).join('\n')
        );
        const spriteName = `sprite_${s}.jpg`;
        await new Promise((resolve, reject) => {
            ffmpeg()
                .input(listFile)
                .inputOptions(['-f concat', '-safe 0'])
                .outputOptions([
                    `-vf scale=${thumbWidth}:${thumbHeight},tile=${COLS}x${ROWS}`,
                    '-frames:v 1',
                    // '-qscale:v 2'
                ])
                .output(path.join(output, spriteName))
                .on('end', resolve)
                .on('error', reject)
                .run();
        });

        fs.unlinkSync(listFile);


        // ---- sprite frame metadata ----
        let start_image = s === 0 ? 0 : (s * THUMBS_PER_SPRITE) + 1;
        let end_image = (s + 1) * THUMBS_PER_SPRITE;
        const frames = {};
        for (let globalIndex = start_image; globalIndex <= end_image; globalIndex++) {
            const localIndex = globalIndex - start_image;

            const col = localIndex % COLS;
            const row = Math.floor(localIndex / COLS);

            frames[globalIndex] = {
                x: -(col * thumbWidth),
                y: -(row * thumbHeight)
            };
        }
        sprites.push({
            index: s,
            start: start_image,
            end: end_image,
            frames: frames,
            url: `${APP_STORAGE}user-blogs/video-thumbnails${blog._id}/${spriteName}`
        });
    }

    // global metadata
    const metadata = {
        thumbWidth,
        thumbHeight,
        interval,
        thumbsPerSprite: THUMBS_PER_SPRITE,
        columns: COLS,
        rows: ROWS,
        totalSprites,
        count,
        sprites
    };

    fs.writeFileSync(
        path.join(output, 'sprites.json'),
        JSON.stringify(metadata, null, 2)
    );

    // cleanup thumbs
    thumbs.forEach(f => fs.unlinkSync(path.join(output, f)));
    return metadata;
}

export async function UploadVideoInChunks(req, res) {
    try {
        if (req.files == undefined || req.files.file == undefined) {
            return res.status(200).json({ status: 500, message: 'No file uploaded' });
        }
        // This is a simplified example. In production, you should handle edge cases, errors, and security concerns.
        const file = req.files.file;
        const fileName = req.body["fileName"];
        const totalChunks = parseInt(req.body["totalChunks"]);
        const current_chunk = parseInt(req.body["chunkIndex"]);
        const userid = req.body["userid"];
        const file_size = parseFloat(req.body["file_size"]);
        let before_file_uploaded = false;
        let is_file_merge = false;

        let folder_name = fileName.trim().toLowerCase();
        folder_name = folder_name.replaceAll(' ', "_")
        .replaceAll('.', "_").replaceAll('-', "_").replaceAll(',', "_").replaceAll('/', "_").replaceAll('\\', "_").replaceAll('(', "_")
        .replaceAll(')', "_").replaceAll('#', "_").replaceAll('%', "_").replaceAll('@', "_").replaceAll('!', "_").replaceAll('$', "_")
        .replaceAll('&', "_").replaceAll('*', "_").replaceAll('+', "_").replaceAll('=', "_").replaceAll('?', "_").replaceAll('^', "_")
        .replaceAll('`', "_").replaceAll('~', "_").replaceAll('{', "_").replaceAll('}', "_").replaceAll('[', "_").replaceAll(']', "_")
        .replaceAll('|', "_").replaceAll('||', "_").replaceAll("'", "_").replaceAll("\"", "_").replaceAll("<", "_").replaceAll(">", "_")
        .replaceAll(";", "_").replaceAll(":", "_");

        const uploadpath = `${storageFolderPath()}large-uploads/${userid}/${folder_name}-${file_size}/`;
        const view_path = `${APP_STORAGE}large-uploads/${userid}/${folder_name}-${file_size}/`;
        const json_file_name = `${folder_name}-${file_size}.json`;
        const json_file_path = path.join(uploadpath, json_file_name);
        const json_file_view_path = `${view_path}${json_file_name}`;
        const upload_file_view_path = `${view_path}${fileName}`;

        if (!fs.existsSync(uploadpath)) {
            fs.mkdirSync(uploadpath, { recursive: true });
        }

        let previous_metadata = {
            totalchunks: 0,
            uploadedchunk: 0,
            date_time: new Date(),
            fileName: '',
            file_size:0,
            chunk_indexs: [],
        }
        if (fs.existsSync(json_file_path)) {
            previous_metadata = await fs.readFileSync(json_file_path, 'utf8');
            previous_metadata = JSON.parse(previous_metadata);
            if (previous_metadata.file_size == file_size && previous_metadata.fileName == fileName) {// if current total chunks is same as previous total chunks then only we can check about already uploaded chunk otherwise we have to upload file again because of total chunks is changed which means file is changed.
                before_file_uploaded = true;
                let t_chunk = totalChunks;
                let c_chunk = current_chunk;
                let p_chunk = previous_metadata.uploadedchunk;
                
                if (t_chunk == p_chunk) {// if current total chunks is same as previous uploaded chunk then no need to upload file again because file is already uploaded with same total chunks and same file name
                    return res.status(200).json({
                        status: 200,
                        message: 'file already uploaded',
                        before_file_uploaded: before_file_uploaded,
                        previous_metadata: previous_metadata,
                        folder_name:folder_name,
                        uploadpath:uploadpath,
                        json_file_path:json_file_path,
                        file_name:fileName,
                        json_file_view_path:json_file_view_path,
                        upload_file_view_path:upload_file_view_path,
                        is_file_merge:is_file_merge,
                    });
                }
                if (c_chunk <= p_chunk) {//if previous total chunks is less than or equal to already uploaded chunk then no need to upload file again
                    return res.status(200).json({
                        status: 200,
                        message: 'chunk already uploaded',
                        before_file_uploaded: before_file_uploaded,
                        previous_metadata: previous_metadata,
                        folder_name:folder_name,
                        uploadpath:uploadpath,
                        json_file_path:json_file_path,
                        file_name:fileName,
                        json_file_view_path:json_file_view_path,
                        upload_file_view_path:upload_file_view_path,
                        is_file_merge:is_file_merge,
                    });
                } else {
                    fs.unlinkSync(json_file_path);
                }
            }
        }
        let previous_metadata_chunk_indexs = previous_metadata.chunk_indexs;
        previous_metadata_chunk_indexs.push({ index: current_chunk+1 });
        let new_metadata = {
            totalchunks: totalChunks,
            uploadedchunk: current_chunk,
            date_time: moment().tz(process.env.TIMEZONE).format('YYYY-MM-DD HH:mm:ss'),
            fileName: fileName,
            file_size:file_size,
            chunk_indexs: previous_metadata_chunk_indexs,
        };

        if (current_chunk == (totalChunks - 1)) {
            new_metadata.uploadedchunk = current_chunk+1;
        }
        fs.writeFileSync(json_file_path, JSON.stringify(new_metadata, null, 2));

        const chunkFilePath = path.join(uploadpath, `chunk_${current_chunk}`);
        await file.mv(chunkFilePath);

        if (current_chunk == (totalChunks - 1)) {// if current chunk is last chunk then only we can merge all chunks and create final file otherwise we have to wait for all chunks to be uploaded
            const finalFilePath = path.join(uploadpath, fileName);
            const writeStream = fs.createWriteStream(finalFilePath);
            for (let i = 0; i < totalChunks; i++) {
                const chunkPath = path.join(uploadpath, `chunk_${i}`);
                const data = fs.readFileSync(chunkPath);
                writeStream.write(data);
                fs.unlinkSync(chunkPath);
            }
            writeStream.end();
            is_file_merge=true;
        }


        return res.status(200).json({
            status: 200,
            message: 'success',
            before_file_uploaded: before_file_uploaded,
            previous_metadata: previous_metadata,
            folder_name:folder_name,
            uploadpath:uploadpath,
            json_file_path:json_file_path,
            file_name:fileName,
            json_file_view_path:json_file_view_path,
            upload_file_view_path:upload_file_view_path,
            is_file_merge:is_file_merge,
        });

    } catch (error) {
        return res.status(200).json({ status: 500, message: error.message });
    }
}


export async function UploadVideoInChunksWithWorker(req, res) {
    try {
        if (req.files == undefined || req.files.file == undefined) {
            return res.status(500).json({ status: 500, message: 'No file uploaded' });
        }
        // This is a simplified example. In production, you should handle edge cases, errors, and security concerns.
        const file = req.files.file;
        const fileName = req.body["fileName"];
        const totalChunks = parseInt(req.body["totalChunks"]);
        const current_chunk = parseInt(req.body["chunkIndex"]);
        const userid = req.body["userid"];
        const file_size = parseFloat(req.body["file_size"]);

        const LargeFileHandler = new Worker(
            path.join(__dirname, "HandleLargeFileWorker.js"),
            {
                workerData: {
                    request: req.body,
                    file: req.files.file.data,
                    file_name: fileName,
                }
            });
        LargeFileHandler.on("message",  (data) => {
            return res.status(200).json(data);
        });
        LargeFileHandler.on("error", (e) => {
            throw new Error(e);
        });

    } catch (error) {
        return res.status(500).json({ status: 500, message: error.message });
    }
}
