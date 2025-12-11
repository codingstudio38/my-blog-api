require("dotenv").config();
const express = require("express");
const cluster = require("cluster");
const os = require("os");
const WebsocketController = require("./Controllers/WebsocketController");
const totalCPUs = os.cpus().length;
const PORT = process.env.PORT;
const HOST = process.env.HOST;
const path = require("path");
const Fileupload = require("express-fileupload");
const cors = require("cors");
const bodyParser = require("body-parser");
const expressSession = require("express-session");

try {
    // if (cluster.isPrimary) {
    //     WebsocketController.runWsServer();
    //     console.log(`Primary server running. PID: ${process.pid}`);
    //     // Create workers
    //     for (let i = 0; i < totalCPUs; i++) {
    //         cluster.fork();
    //     }
    //     // If any worker dies → create a new one
    //     cluster.on("exit", (worker) => {
    //         console.log(`Worker ${worker.process.pid} died. Starting new one...`);
    //         cluster.fork();
    //     });

    // } else { }
    // WORKER PROCESS
    WebsocketController.runWsServer();
    const app = express();
    app.set("view engine", "ejs");
    app.set("views", path.join(__dirname, "./views/"));

    app.use(expressSession({
        resave: false,
        saveUninitialized: true,
        secret: 'user secret',
        // cookie: { secure: true }
    }));

    app.use(express.json());
    app.use(Fileupload());
    app.use(cors());
    app.use(bodyParser.json());
    app.use("/uploads", express.static("./storage/"));
    app.use("/public", express.static("./public/"));
    app.use(require("./routes/Route"));

    // ---------------------------
    // ⭐ GLOBAL ERROR HANDLER
    // ---------------------------
    app.use((err, req, res, next) => {
        console.error(`Error (Worker ${process.pid}):`, err);

        res.status(500).json({
            status: 500,
            message: err.message || "Internal Server Error",
            data: ''
        });
    });

    // ---------------------------
    // ⭐ PROCESS-LEVEL ERROR HANDLERS
    // ---------------------------
    process.on("uncaughtException", (err, req, res, next) => {
        // console.error("Uncaught Exception:", err);
        res.status(500).json({
            status: 500,
            message: err.message || "Internal Server Error",
            data: ''
        });
    });

    process.on("unhandledRejection", (err, req, res, next) => {
        // console.error("Unhandled Promise Rejection:", err);
        res.status(500).json({
            status: 500,
            message: err.message || "Internal Server Error",
            data: ''
        });
    });

    app.listen(PORT, HOST, () => {
        console.log(`Worker ${process.pid} running: http://${HOST}:${PORT}`);
    });


} catch (err) {
    console.error("Top-level server error:", err.message);
}
