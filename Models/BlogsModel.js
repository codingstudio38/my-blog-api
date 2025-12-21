const moment = require('moment-timezone');
const mongooseConnect = require('../Config/MongooseConfig');
const mongoose = require('mongoose');
const BlogSchema = new mongooseConnect.Schema({
    user_id: { type: 'ObjectId', required: true, trim: true, },
    title: { type: String, required: true, trim: true, },
    sort_description: { type: String, required: true, trim: true, },
    blog_type: { type: 'ObjectId', required: true, trim: true, },
    content: { type: String, required: true, trim: true },
    photo: { type: String, required: true, trim: true, },
    thumbnail: { type: String, required: false, trim: true, },
    content_alias: { type: String, required: false, trim: true, },
    active_status: { type: Number, required: false, default: 1 },
    is_shared_blog: { type: Boolean, required: false, default: false },
    shared_blog_id: { type: String, required: false, trim: true, default: '' },
    main_blog_user_id: { type: String, required: false, trim: true },
    is_archive: { type: Boolean, required: false, default: false },
    like: { type: Boolean, required: false, default: true },
    share: { type: Boolean, required: false, default: true },
    comment: { type: Boolean, required: false, default: true },
    delete: { type: Number, required: false, default: 0 },
    created_at: { type: Date, required: true, default: moment().tz(process.env.TIMEZONE).format('YYYY-MM-DD HH:mm:ss') },//new Date()
    updated_at: { type: Date, required: false, default: null },
});
BlogSchema.methods.findByBlogId = async function (id) {
    try {
        return await mongoose.model('blogs').findOne({ _id: id });
    } catch (error) {
        throw new Error(error);
    }
}
const BlogsModel = mongooseConnect.model('blogs', BlogSchema);
module.exports = BlogsModel;
