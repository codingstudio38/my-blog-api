try {
    require("dotenv").config();
    const PORT = process.env.PORT;
    const path = require("path");
    const Fileupload = require("express-fileupload");
    var cors = require("cors");
    const express = require("express");
    var bodyParser = require("body-parser");
    const app = express();
    app.set("view engine", "ejs");
    app.set("views", path.join(__dirname, "./views/"));
    const expressSession = require("express-session");
    const WebsocketController = require("./Controllers/WebsocketController");
    app.use(expressSession({
        "resave": false,
        "saveUninitialized": true,
        "lek": 'user_id',
        "secret": 'user secret',
        // cookie: { secure: true }
    }));
    // WebsocketController.runWsServer();
    app.use(express.json());
    app.use(Fileupload());
    app.use(cors());
    app.use(bodyParser.json());
    app.use("/uploads", express.static("./storage/"));
    app.use("/public", express.static("./public/"));
    app.use(require("./routes/Route"));
    app.listen(PORT, () => {
        console.log(`node server running on :http://localhost:${process.env.PORT}`);
    });
    console.log(`cluster is working. pid:${process.pid}`);
} catch (error) {
    console.error(`Failed to run node server! ${error.message}`);
} 