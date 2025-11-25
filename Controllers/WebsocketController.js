const http = require("http");
const webSocketServer = require("websocket").server;
// const Mycontroller = require("./Mycontroller");
const UsersModel = require("./../Models/UsersModel");
const UsersFriendModel = require('../Models/UsersFriendModel');
const SOCKET_PORT = process.env.SOCKETPORT;
const new_client = process.env.new_client;
const client_disconnected = process.env.client_disconnected;
const new_message_receive = process.env.new_message_receive;
const receive_binary_data = process.env.receive_binary_data;

const clients = {};
function originIsAllowed(origin) {
    return true; // Add your logic to allow specific origins
}
const runWsServer = async () => {
    const serverForWs = http.createServer();
    serverForWs.listen(SOCKET_PORT);

    const wsServer = new webSocketServer({
        httpServer: serverForWs,
        autoAcceptConnections: false,
    });

    wsServer.on("request", async (request) => {
        if (originIsAllowed(request.origin)) {
            console.log(new Date() + " Received a new connection from origin " + request.origin);
        }

        if (!request.resourceURL.query || !request.resourceURL.query.Authorization || request.resourceURL.query.Authorization === "") {
            console.log(new Date() + " Connection rejected " + request.origin);
            request.reject();
            return;
        }

        const userID = request.resourceURL.query.Authorization;
        const connection = request.accept(null, request.origin);
        clients[userID] = connection;
        const friend_model = new UsersFriendModel;
        const myfriends = await friend_model.getAllMyFriendByid(userID);

        // for (let key in clients) {
        //     clients[key].sendUTF(JSON.stringify({
        //         code: new_client,
        //         msg: "New client connected..",
        //         clientid: userID,
        //         result: userID,
        //     }));// Notify all clients of the new connection
        // }
        let data = JSON.stringify({
            code: new_client,
            msg: "New client connected..",
            clientid: userID,
            result: userID,
        });
        if (myfriends.length > 0) {
            myfriends.forEach((element) => {
                const to_user_id = element.to_user_id.toString();
                if (clients[to_user_id]) {
                    clients[to_user_id].sendUTF(data);
                }
            })
        }
        UpdateUserWsStatus(userID, 1);// update new connected user status

        connection.on("message", function (message) {
            if (message.type === "utf8") {
                console.log("Received Message:", message.utf8Data);
                let data = {
                    ...message, clientid: userID, code: new_message_receive, msg: "Received message.",
                };
                // Broadcast message to all clients
                for (let key in clients) {
                    clients[key].sendUTF(JSON.stringify(data));
                }
            } else if (message.type === "binary") {
                console.log("Received Binary Message of " + message.binaryData.length + " bytes");
                // Broadcast binary message to all clients

                let data = {
                    ...message, clientid: userID, code: receive_binary_data, msg: "Received binary message.",
                };
                for (let key in clients) {
                    clients[key].sendBytes(data);
                }
            }
        });

        connection.on("close", function (reasonCode, description) {
            console.log(new Date() + " Peer " + connection.remoteAddress + " disconnected.");

            // if (clients[userID]) {
            //     delete clients[userID];
            // }
            // // clients = clients.filter(num => num !== userID);
            // // Notify all clients of the disconnection
            // for (let key in clients) {
            //     clients[key].sendUTF(JSON.stringify({
            //         code: client_disconnected,
            //         msg: "Client disconnected..",
            //         clientid: userID,
            //         result: userID,
            //     }));
            // }
            let data = JSON.stringify({
                code: client_disconnected,
                msg: "Client disconnected..",
                clientid: userID,
                result: userID,
            });
            if (myfriends.length > 0) {
                myfriends.forEach((element) => {
                    const to_user_id = element.to_user_id.toString();
                    if (clients[to_user_id]) {
                        clients[to_user_id].sendUTF(data);
                    }
                })
            }
            UpdateUserWsStatus(userID, 0);// update disconnected user status
        });
    });
    console.log(`WebSocket server listening on port ${SOCKET_PORT}`);
};

async function UpdateUserWsStatus(userid, Status) {
    try {
        if (userid == "") {
            console.log('ws user id required');
            return 0;
        }
        await UsersModel.updateOne({ _id: userid }, { $set: { wsstatus: Status } });
        console.log({ "status": 200, "message": "Success ws status updated" });//, "data": updateis 
        return 1;
    } catch (error) {
        console.log({ "status": 400, "message": "Failed to update ws status" });//, "error": error.message 
        return 0;
    }
}
module.exports = { runWsServer, clients };
