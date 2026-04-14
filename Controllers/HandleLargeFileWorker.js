
import { parentPort, workerData } from "worker_threads";
import {  storageFolderPath } from "./Healper.js";
import path from "path";
import fs from "fs";
import moment from "moment-timezone";
import { fileURLToPath } from "url";
const APP_STORAGE = process.env.APP_STORAGE;
// __dirname replacement for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function HandleLargeFile(req, fileBuffer, file_name) {
    try {
        if (fileBuffer == undefined || fileBuffer == null) {
            return { status: 500, message: 'No file uploaded' };
        }
        const file = fileBuffer;
        const fileName = file_name;
        const totalChunks = parseInt(req["totalChunks"]);
        const current_chunk = parseInt(req["chunkIndex"]);
        const userid = req["userid"];
        const file_size = parseFloat(req["file_size"]);
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
                    return {
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
                    };
                }
                if (c_chunk <= p_chunk) {//if previous total chunks is less than or equal to already uploaded chunk then no need to upload file again
                    return {
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
                    };
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
        await fs.promises.writeFile(chunkFilePath, file);
        // await file.mv(chunkFilePath);

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
        return {
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
        };
    } catch (error) {
        return { status: 500, message: error.message, data: false };
    }
}
HandleLargeFile(workerData.request, workerData.file, workerData.file_name)
.then((data) => parentPort.postMessage(data))
.catch((err) => parentPort.postMessage(err));
