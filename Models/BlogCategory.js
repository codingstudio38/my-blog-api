const moment = require('moment-timezone');
const mongooseConnect = require('../Config/MongooseConfig');
const mongoose = require('mongoose');
const BlogCategorySchema = new mongooseConnect.Schema({
    name: { type: String, required: true, trim: true, },
    delete: { type: Number, required: false, default: 0 },
    created_at: { type: Date, required: true, default: moment().tz(process.env.TIMEZONE).format('YYYY-MM-DD HH:mm:ss') },//new Date()
    updated_at: { type: Date, required: false, default: null },
});
BlogCategorySchema.methods.findByBlogCategoryId = async function (id) {
    try {
        return await mongoose.model('blog_categories').findOne({ _id: id });
    } catch (error) {
        throw new Error(error);
    }
}
const BlogsCategoryModel = mongooseConnect.model('blog_categories', BlogCategorySchema);
module.exports = BlogsCategoryModel;
