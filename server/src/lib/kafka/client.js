import { Kafka, logLevel } from 'kafkajs';
import { logger } from '../../utils/logger.js';

const WinstonLogCreator = logLevel => {
  return ({ namespace, level, log }) => {
    const { message, ...extra } = log;
    switch (level) {
      case logLevel.ERROR:
      case logLevel.NOTHING:
        logger.error(`[${namespace}] ${message}`, extra);
        break;
      case logLevel.WARN:
        logger.warn(`[${namespace}] ${message}`, extra);
        break;
      case logLevel.INFO:
        logger.info(`[${namespace}] ${message}`, extra);
        break;
      case logLevel.DEBUG:
        logger.debug(`[${namespace}] ${message}`, extra);
        break;
    }
  }
}

const BROKER = process.env.KAFKA_BROKER;
export const kafka = new Kafka({
  clientId: 'notification-service',
  brokers: [BROKER],
  logLevel: logLevel.INFO,
  logCreator: WinstonLogCreator
});
