const moment = require('moment-timezone');
const mongooseConnect = require('../Config/MongooseConfig');
const mongoose = require('mongoose');
const BlogSchema = new mongooseConnect.Schema({
    user_id: { type: 'ObjectId', required: true, trim: true, },
    blog_id: { type: 'ObjectId', required: true, trim: true, },
    delete: { type: Number, required: false, default: 0 },
    created_at: { type: Date, required: true, default: moment().tz(process.env.TIMEZONE).format('YYYY-MM-DD HH:mm:ss') },//new Date()
    updated_at: { type: Date, required: false, default: null },
});

const LikesModel = mongooseConnect.model('likes', BlogSchema);
module.exports = LikesModel;
