const mongodb = require('mongodb');
const moment = require('moment-timezone');
const mongooseConnect = require('../Config/MongooseConfig');
const mongoose = require('mongoose');
const BlogSchema = new mongooseConnect.Schema({
    user_id: { type: 'ObjectId', required: true, trim: true, },
    title: { type: String, required: true, trim: true, },
    content: { type: String, required: true, trim: true },
    photo: { type: String, required: true, trim: true, },
    content_alias: { type: String, required: true, trim: true, },
    active_status: { type: Number, required: false, default: 1 },
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
