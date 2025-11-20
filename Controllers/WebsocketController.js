const http = require("http");
const webSocketServer = require("websocket").server;
const Mycontroller = require("./Mycontroller");
const SOCKET_PORT = process.env.SOCKETPORT;
const clients = {};
function originIsAllowed(origin) {
    return true; // Add your logic to allow specific origins
}
const runWsServer = () => {
    const serverForWs = http.createServer();
    serverForWs.listen(SOCKET_PORT);

    const wsServer = new webSocketServer({
        httpServer: serverForWs,
        autoAcceptConnections: false,
    });

    wsServer.on("request", (request) => {
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


        for (let key in clients) {
            clients[key].sendUTF(JSON.stringify({
                code: 1000,
                msg: "New client connected..",
                clientid: userID,
            }));// Notify all clients of the new connection
        }
        Mycontroller.UpdateUserWsStatus(userID, 1);// update new connected user status

        connection.on("message", function (message) {
            if (message.type === "utf8") {
                console.log("Received Message:", message.utf8Data);
                let data = {
                    ...message, clientid: userID, code: 3000, msg: "Received message.",
                };
                // Broadcast message to all clients
                for (let key in clients) {
                    clients[key].sendUTF(JSON.stringify(data));
                }
            } else if (message.type === "binary") {
                console.log("Received Binary Message of " + message.binaryData.length + " bytes");
                // Broadcast binary message to all clients

                let data = {
                    ...message, clientid: userID, code: 4000, msg: "Received binary message.",
                };
                for (let key in clients) {
                    clients[key].sendBytes(data);
                }
            }
        });

        connection.on("close", function (reasonCode, description) {
            console.log(new Date() + " Peer " + connection.remoteAddress + " disconnected.");

            if (clients[userID]) {
                delete clients[userID];
            }
            // clients = clients.filter(num => num !== userID);
            // Notify all clients of the disconnection
            for (let key in clients) {
                clients[key].sendUTF(JSON.stringify({
                    code: 2000,
                    msg: "Client disconnected..",
                    clientid: userID,
                }));
            }
            Mycontroller.UpdateUserWsStatus(userID, 0);// update disconnected user status
        });
    });
    console.log(`WebSocket server listening on port ${SOCKET_PORT}`);
};
module.exports = { runWsServer, clients };
