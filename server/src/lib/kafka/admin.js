import { kafka } from "./client.js";
import { logger } from "../../utils/logger.js";

async function init() {
    const admin = kafka.admin();

    try {
        logger.info('Connecting Admin...');
        await admin.connect();
        logger.info('Admin connected.');

        const existingTopics = await admin.listTopics();
        if (existingTopics.includes('notifications')) {
            logger.info('Topic [ notifications ] already exists.');
            return;
        }

        logger.info('Creating Topic...');
        await admin.createTopics({
            topics: [
                {
                    topic: 'notifications',
                    numPartitions: 2,
                },
            ],
        });
        logger.info('Topic created [ notifications ]');

    } catch (error) {
        logger.error('Error creating topic:', error);
    } finally {
        try {
            logger.info('Disconnecting Admin...');
            await admin.disconnect();
            logger.info('Admin disconnected.');
        } catch (error) {
            logger.error('Error disconnecting Admin:', error);
        }
    }
}

init();
