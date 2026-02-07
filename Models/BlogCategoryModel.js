import moment from "moment-timezone";
import mongoose from "mongoose";
import mongooseConnect from "../Config/MongooseConfig.js";

const BlogCategorySchema = new mongooseConnect.Schema({
    name: { type: String, required: true, trim: true },
    delete: { type: Number, required: false, default: 0 },

    created_at: {
        type: Date,
        required: true,
        default: () => moment().tz(process.env.TIMEZONE).format("YYYY-MM-DD HH:mm:ss"),
    },

    updated_at: { type: Date, required: false, default: null }
});

// ----------------------
// 🔹 Schema Method
// ----------------------
BlogCategorySchema.methods.findByBlogCategoryId = async function (id) {
    try {
        return await mongoose
            .model("blog_categories")
            .findOne({ _id: id });
    } catch (error) {
        throw new Error(error);
    }
};

const BlogsCategoryModel = mongooseConnect.model(
    "blog_categories",
    BlogCategorySchema
);

export default BlogsCategoryModel;
