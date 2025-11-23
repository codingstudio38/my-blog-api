const moment = require('moment-timezone');
const mongooseConnect = require('../Config/MongooseConfig');
const mongoose = require('mongoose');
const mongodb = require('mongodb');
const Schema = new mongooseConnect.Schema({
    requestid: { type: 'ObjectId', required: false, trim: true, },
    userid: { type: 'ObjectId', required: true, trim: true, },
    notify_toid: { type: 'ObjectId', required: true, trim: true, },
    to: { type: 'ObjectId', required: false, trim: true, },
    from: { type: 'ObjectId', required: false, trim: true, },
    blog_id: { type: 'ObjectId', required: false, trim: true, },
    accept_status: { type: Number, required: false, default: 0 },
    from_user_name: { type: String, required: false, default: '' },
    from_user_photo: { type: String, required: false, default: '' },
    to_user_name: { type: String, required: false, default: '' },
    to_user_photo: { type: String, required: false, default: '' },
    category: { type: Number, required: true },
    text: { type: String, required: false, default: 'notification' },
    read_status: { type: Number, required: false, default: 0 },
    remove_byid: { type: String, required: false, trim: true, },
    delete: { type: Number, required: false, default: 0 },
    created_at: { type: Date, required: true, default: moment().tz(process.env.TIMEZONE).format('YYYY-MM-DD HH:mm:ss') },//new Date()
    updated_at: { type: Date, required: false, default: null },
});
Schema.methods.FindById = async function (id) {
    try {
        return await mongoose.model('all_notifications').find({
            $and: [
                { '_id': new mongodb.ObjectId(id) },
                { 'delete': 0 }
            ]
        }).countDocuments();
    } catch (error) {
        throw new Error(error);
    }
}
const AllNotificationsModel = mongooseConnect.model('all_notifications', Schema);
module.exports = AllNotificationsModel;
