import moment from "moment-timezone";
import mongoose from "mongoose";
import mongooseConnect from "../Config/MongooseConfig.js";

const BlogSchema = new mongooseConnect.Schema({
    user_id: { type: "ObjectId", required: true, trim: true },
    title: { type: String, required: true, trim: true },
    sort_description: { type: String, required: true, trim: true },
    blog_type: { type: "ObjectId", required: true, trim: true },
    content: { type: String, required: true, trim: true },
    photo: { type: String, required: true, trim: true },
    thumbnail: { type: String, required: false, trim: true },
    content_alias: { type: String, required: false, trim: true },

    active_status: { type: Number, required: false, default: 1 },
    is_shared_blog: { type: Boolean, required: false, default: false },
    shared_blog_id: { type: String, required: false, trim: true, default: "" },
    main_blog_user_id: { type: String, required: false, trim: true },

    publish: { type: Boolean, required: false, default: false },
    is_archive: { type: Boolean, required: false, default: false },

    like: { type: Boolean, required: false, default: true },
    share: { type: Boolean, required: false, default: true },
    comment: { type: Boolean, required: false, default: true },

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
BlogSchema.methods.findByBlogId = async function (id) {
    try {
        return await mongoose
            .model("blogs")
            .findOne({ _id: id });
    } catch (error) {
        throw new Error(error);
    }
};
BlogSchema.methods.FindAll = async function (query = {}, limit = 10, skip = 0, sort = {}, select = {}) {
    try {
        let select_length = Object.keys(select).length;
        let project = {};
        if (select_length <= 0) {
            project = { __v: 1, _id: 1 };
            const all_columns = Object.keys(BlogSchema.obj);//Object.keys(BlogsModel.schema.paths); 
            all_columns.forEach((col) => {
                project[col] = { $ifNull: [`$${col}`, ""] };
            });
        } else {
            project = select;
        }

        const data = await mongoose
            .model("blogs")
            .aggregate([
                { $match: query },
                { $sort: sort == false ? { _id: -1 } : sort },
                { $skip: skip },
                { $limit: limit },
                { $project: project },
            ])
        let total = await mongoose
            .model("blogs")
            .find(query)
            .countDocuments();
        return { data, total };
    } catch (error) {
        throw new Error(error);
    }
};
const BlogsModel = mongooseConnect.model("blogs", BlogSchema);

export default BlogsModel;
