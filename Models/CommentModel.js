const moment = require('moment-timezone');
const mongooseConnect = require('../Config/MongooseConfig');
const mongoose = require('mongoose');
const BlogSchema = new mongooseConnect.Schema({
    user_id: { type: 'ObjectId', required: true, trim: true, },
    blog_id: { type: 'ObjectId', required: true, trim: true, },
    blog_post_by: { type: 'ObjectId', required: true, trim: true, },
    comment: { type: String, required: true, trim: true, },
    link_shared_blog_id: { type: String, required: false, trim: true, },
    shared_blog_id: { type: String, required: false, trim: true, },
    shared_blog_comment_id: { type: String, required: false, trim: true, },
    hide_status: { type: Number, required: false, default: 0, },
    delete: { type: Number, required: false, default: 0 },
    created_at: { type: Date, required: true, default: moment().tz(process.env.TIMEZONE).format('YYYY-MM-DD HH:mm:ss') },//new Date()
    updated_at: { type: Date, required: false, default: null },
});

const CommentsModel = mongooseConnect.model('comments', BlogSchema);
module.exports = CommentsModel;
