import mongodb from "mongodb";
import moment from "moment-timezone";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import mongooseConnect from "../Config/MongooseConfig.js";

const UsersSchema = new mongooseConnect.Schema({
    name: {
        type: String,
        trim: true,
        default: "auto generate name by mongo",
    },

    phone: {
        type: Number,
        required: true,
        unique: true,
        trim: true,
    },

    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },

    photo: {
        type: String,
        default: null,
        trim: true,
    },

    password: {
        type: String,
        required: true,
    },

    tokens: [
        {
            token: {
                type: String,
                required: true,
            },
        },
    ],

    occupation: { type: String, default: "", trim: true },
    skills: { type: String, default: "", trim: true },
    dob: { type: Date, default: null },
    country: { type: String, default: "", trim: true },
    address: { type: String, default: "", trim: true },
    about_us: { type: String, default: "", trim: true },

    active_status: { type: Number, default: 1 },
    delete: { type: Number, default: 0 },

    created_at: {
        type: Date,
        required: true,
        default: () => moment().tz(process.env.TIMEZONE).format("YYYY-MM-DD HH:mm:ss"),
    },

    updated_at: { type: Date, default: null },

    wsstatus: { type: Number, default: 0 },
});

/* ===========================
   METHODS
=========================== */

UsersSchema.methods.generateAuthToken = async function () {
    try {
        const token = jwt.sign(
            { _id: new mongodb.ObjectId(this._id) },
            process.env.SECRET_KEY,
            { expiresIn: "24h" }
        );

        this.tokens = this.tokens.concat({ token });
        await this.save();

        return token;
    } catch (error) {
        throw new Error(error.message);
    }
};

UsersSchema.methods.findByUserId = async function (id) {
    try {
        return await mongoose.model("users").findOne({ _id: id });
    } catch (error) {
        throw new Error(error.message);
    }
};

const UsersModel = mongooseConnect.model("users", UsersSchema);

export default UsersModel;
