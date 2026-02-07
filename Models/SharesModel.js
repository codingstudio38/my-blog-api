import moment from "moment-timezone";
import mongoose from "mongoose";
import mongooseConnect from "../Config/MongooseConfig.js";

const BlogSchema = new mongooseConnect.Schema({
    user_id: { type: "ObjectId", required: true, trim: true },
    blog_id: { type: "ObjectId", required: true, trim: true },
    blog_post_by: { type: "ObjectId", required: true, trim: true },

    delete: { type: Number, required: false, default: 0 },

    created_at: {
        type: Date,
        required: true,
        default: () => moment().tz(process.env.TIMEZONE).format("YYYY-MM-DD HH:mm:ss"),
    },

    updated_at: { type: Date, required: false, default: null }
});

const SharesModel = mongooseConnect.model("shares", BlogSchema);

export default SharesModel;
