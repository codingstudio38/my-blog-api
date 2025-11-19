const mongodb = require('mongodb');
const moment = require('moment-timezone');
const mongoose = require('mongoose');
const mongooseConnect = require('./../Config/MongooseConfig');
const jwt = require('jsonwebtoken');
const UsersSchema = new mongooseConnect.Schema({
    name: { type: String, required: false, trim: true, default: "auto generate name by mongo" },
    phone: { type: Number, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true },
    photo: { type: String, required: false, trim: true, default: null },
    password: { type: String, required: true },
    tokens: [{
        token: {
            type: String, required: true
        }
    }],
    active_status: { type: Number, required: false, default: 1 },
    delete: { type: Number, required: false, default: 0 },
    created_at: { type: Date, required: true, default: moment().tz(process.env.TIMEZONE).format('YYYY-MM-DD HH:mm:ss') },//new Date()
    updated_at: { type: Date, required: false, default: null },
    wsstatus: { type: Number, required: false, default: 0 },
});
UsersSchema.methods.generateAuthToken = async function () {
    try {
        const _token = jwt.sign(
            { _id: new mongodb.ObjectId(this._id) },
            process.env.SECRET_KEY,
            { expiresIn: '24h' },
        )
        this.tokens = this.tokens.concat({ token: _token })
        await this.save();
        return _token;
    } catch (error) {
        throw new Error(error);
    }
}
UsersSchema.methods.findByUserId = async function (id) {
    try {
        return await mongoose.model('users').findOne({ _id: id });
    } catch (error) {
        throw new Error(error);
    }
}
const UsersModel = mongooseConnect.model('users', UsersSchema);
module.exports = UsersModel;