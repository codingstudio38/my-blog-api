import jwt from "jsonwebtoken";
import mongodb from "mongodb";
import UsersModel from "../Models/UsersModel.js";

export default async function Auth(req, resp, next) {
    try {
        const _token = req.headers["authorization"];

        const allowlist = [
            "http://localhost:4200",
            "http://localhost:3000"
        ];

        // if (allowlist.indexOf(req.header("Origin")) === -1) {
        //   return resp.status(400).json({
        //     status: 400,
        //     message: "Access denied..!!"
        //   });
        // }

        if (!_token) {
            return resp.status(401).json({
                status: 401,
                message: "Unauthorized"
            });
        }

        let ex_token = _token.split(" ");
        ex_token = ex_token.length === 2 ? ex_token[1] : "";

        const verifyUsers = jwt.verify(ex_token, process.env.SECRET_KEY);

        if (!verifyUsers) {
            return resp.status(401).json({
                status: 401,
                message: "Invalid token detected..!!"
            });
        }

        const user = await UsersModel.findOne({
            _id: new mongodb.ObjectId(verifyUsers._id)
        });

        const _check = user.tokens.filter((item) => item.token === ex_token);

        if (_check.length === 0) {
            return resp.status(401).json({
                status: 401,
                message: "Token has been expired. Please logged in again."
            });
        }

        req.token = ex_token;
        req.user = user;

        next();
    } catch (error) {
        return resp.status(401).json({
            status: 401,
            message: "Failed..!!",
            error: error.message
        });
    }
}
