import { kafka } from './client.js';
import { logger } from '../../utils/logger.js';

const producer = kafka.producer({
  allowAutoTopicCreation: true,
  retry: {
    retries: 5,
    initialRetryTime: 300,
    maxRetryTime: 30000,
  },
  acks: -1,
});

export const initProducer = async () => {
  try {
    await producer.connect();
    logger.info('Kafka producer connected');
  } catch (error) {
    logger.error(`Error connecting Kafka producer: ${error.message}`, error);
    process.exit(1);
  }
};

const publishNotification = async (notification) => {
  try {
    await producer.send({
      topic: 'notifications',
      messages: [
        { value: JSON.stringify(notification) },
      ],
    });
    logger.info('Notification sent to Kafka');
  } catch (error) {
    logger.error(`Error producing notification to Kafka: ${error.message}`, error);
  }
};

export { initProducer, publishNotification };
