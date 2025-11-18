const path = require('path');
const fs = require('fs');
const mime = require('mime');
function PaginationData(data, total, limitis, pageis) {
    try {
        var totalpage, nextPage, record_from, record_to, hasNextPage, hasPrevPage, prevPage, page_links, skip, currentPage = 0, previous = 0, lastPage = 0, page = 0, limit = 0;
        page = parseInt(pageis);
        limit = parseInt(limitis);
        skip = (page - 1) * limit;
        previous = page - 1;
        currentPage = page;
        totalpage = Math.ceil(total / limit);
        lastPage = totalpage;
        nextPage = parseInt(page + 1);
        record_from = skip + 1;
        record_to = record_from + limit - 1;
        if (record_to > total) {
            record_to = total;
        }
        if (page * limit < total) {
            hasNextPage = true;
            nextPage = nextPage;
        } else {
            hasNextPage = false;
            nextPage = 0;
        }
        if (page <= 1) {
            hasPrevPage = false;
            prevPage = 0;
        } else {
            hasPrevPage = true;
            prevPage = parseInt(page - 1);
        }
        page_links = [];
        for (let i = 1; i <= totalpage; i++) {
            if (page == i) {
                page_links.push({ 'link': i, active: true });
            } else {
                page_links.push({ 'link': i, active: false });
            }
        }
        let page_links_new = [];

        for (let i = 1; i <= totalpage; i++) {
            if (i >= currentPage - 2 && i <= currentPage + 2) {
                if (i === currentPage) {
                    page_links_new.push({ 'link': i, active: true });
                } else {
                    page_links_new.push({ 'link': i, active: false });
                }
            }
        }


        return { docs: data, 'totalpage': totalpage, 'nextPage': nextPage, 'record_from': record_from, 'record_to': record_to, 'hasNextPage': hasNextPage, 'hasPrevPage': hasPrevPage, 'prevPage': prevPage, total: total, current_page: page, page_links_new: page_links_new };
    } catch (error) {
        throw new Error(error.message);
    }

}
function generateRandomString(l = 0) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < l; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
function storageFolderPath() {
    return path.join(__dirname, './../storage/');
}

async function FileInfo(file_name, file_path, file_view_path) {
    try {
        if (file_name == "" || file_name == undefined || file_name == null) return { filetype_st: '', filetype: '', filesize: '', filename: '', file_path: '', file_view_path: '' };
        if (fs.existsSync(`${file_path}`)) {
            const filedata = fs.statSync(file_path);
            const size = filedata.size;
            const fileType = mime.getType(file_path);
            let filetype_st = path.extname(file_path)
            filetype_st = filetype_st.replace('.', '', filetype_st).toLowerCase();
            return { filetype_st: filetype_st, filetype: fileType, filesize: size, filename: file_name, file_path: file_path, file_view_path: file_view_path };
        } else {
            return { filetype_st: '', filetype: '', filesize: '', filename: '', file_path: '', file_view_path: '' };
        }
    } catch (error) {
        throw new Error(error);
    }
}
async function DeleteFile(filePath) {
    try {
        if (filePath == "" || filePath == undefined || filePath == null) return false;
        if (fs.existsSync(`${filePath}`)) {
            fs.unlinkSync(`${filePath}`, (err) => {
                if (err) return false;
                return true;
            });
        } else {
            return false;
        }
    } catch (error) {
        throw new Error(error.message);
    }
}
async function FileExists(filePath) {
    try {
        if (filePath == "" || filePath == undefined || filePath == null) return false;
        if (fs.existsSync(filePath)) {
            return true;
        } else {
            return false;
        }
    } catch (error) {
        throw new Error(error.message);
    }
}
module.exports = { PaginationData, storageFolderPath, generateRandomString, FileInfo, DeleteFile, FileExists };