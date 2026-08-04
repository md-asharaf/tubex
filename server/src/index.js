import connectDB from "./db/index.js";
import { app } from "./app.js";
import { webSocketServer } from "./lib/web-socket.js";
import { initConsumers } from "./lib/kafka/consumer.js";
import { initProducer } from "./lib/kafka/producer.js"
import { logger } from "./utils/logger.js";

const BACKEND_PORT = process.env.BACKEND_PORT;
const WEB_SOCKET_PORT = process.env.WEB_SOCKET_PORT;

const startServers = async () => {
  try {
    await connectDB();
    app.on('error', (err) => {
      logger.error('Backend server error:\n', err);
    });
    app.listen(BACKEND_PORT, () => {
      logger.info(`⚙️ Backend server is running at port ${BACKEND_PORT}`);
      initProducer();
    });
    webSocketServer.on('error', (err) => {
      logger.error('WebSocket server error:\n', err);
    });
    webSocketServer.listen(WEB_SOCKET_PORT, async () => {
      logger.info(`WebSocket server running on port ${WEB_SOCKET_PORT}`);
      initConsumers();
    });
  } catch (err) {
    logger.error('Error during server startup:\n', err);
  }
};

startServers();
