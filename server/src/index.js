import connectDB from "./db/index.js";
import { app } from "./app.js";
import { webSocketServer } from "./lib/web-socket.js";
import { initConsumers } from "./lib/kafka/consumer.js";
import { initProducer } from "./lib/kafka/producer.js"
import { deleteAllCache } from "./lib/redis.js";
const BACKEND_PORT = process.env.BACKEND_PORT;
const WEB_SOCKET_PORT = process.env.WEB_SOCKET_PORT;
const startServers = async () => {
    try {
        await connectDB();
        app.on('error', (err) => {
            console.error('Backend server error:\n', err);
        });
        app.listen(BACKEND_PORT, () => {
            console.log(`⚙️ Backend server is running at port ${BACKEND_PORT}`);
            initProducer();
        });
        webSocketServer.on('error', (err) => {
            console.error('WebSocket server error:\n', err);
        });
        webSocketServer.listen(WEB_SOCKET_PORT, async () => {
            console.log(`WebSocket server running on port ${WEB_SOCKET_PORT}`);
            initConsumers();
        });
    } catch (err) {
        console.error('Error during server startup:\n', err);
    }
};

startServers();
