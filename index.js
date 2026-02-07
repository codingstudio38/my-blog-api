// import dotenv from "dotenv";
// dotenv.config();

import express from "express";
import cluster from "cluster";
import os from "os";
import path from "path";
import cors from "cors";
import fileUpload from "express-fileupload";
import bodyParser from "body-parser";
import session from "express-session";
import { fileURLToPath } from "url";

import { runWsServer, clients } from "./Controllers/WebsocketController.js";
import route from "./routes/Route.js";

const totalCPUs = os.cpus().length;
const PORT = process.env.PORT;
const HOST = process.env.HOST;

// ---- FIX __dirname (not available in ES modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

try {
    // if (cluster.isPrimary) {
    //     runWsServer();
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
    runWsServer();

    const app = express();

    app.set("view engine", "ejs");
    app.set("views", path.join(__dirname, "./views"));

    app.use(
        session({
            resave: false,
            saveUninitialized: true,
            secret: "user secret"
            // cookie: { secure: true }
        })
    );

    app.use(express.json());
    app.use(fileUpload());
    app.use(cors());
    app.use(bodyParser.json());

    app.use("/uploads", express.static(path.join(__dirname, "storage")));
    app.use("/public", express.static(path.join(__dirname, "public")));

    app.use(route);

    // ---------------------------
    // ⭐ GLOBAL ERROR HANDLER
    // ---------------------------
    app.use((err, req, res, next) => {
        console.error(err.message || "Internal Server Error");
        res.status(500).json({
            status: 500,
            message: err.message || "Internal Server Error",
            result: null
        });
    });

    // ---------------------------
    // ⭐ PROCESS-LEVEL ERROR HANDLERS
    // ---------------------------
    process.on("uncaughtException", (err) => {
        console.error("Uncaught Exception:", err.message);
        process.exit(1);
    });

    process.on("unhandledRejection", (reason) => {
        console.error("Unhandled Rejection:", reason);
        process.exit(1);
    });

    app.listen(PORT, HOST, () => {
        console.log(`Worker ${process.pid} running: http://${HOST}:${PORT}`);
    });

} catch (err) {
    console.error("Top-level server error:", err.message);
}
