import { kafka } from "./client.js";

async function init() {
    const admin = kafka.admin();

    try {
        console.log('Connecting Admin...');
        await admin.connect();
        console.log('Admin connected.');

        const existingTopics = await admin.listTopics();
        if (existingTopics.includes('notifications')) {
            console.log('Topic [ notifications ] already exists.');
            return;
        }

        console.log('Creating Topic...');
        await admin.createTopics({
            topics: [
                {
                    topic: 'notifications',
                    numPartitions: 1,
                },
            ],
        });
        console.log('Topic created [ notifications ]');

    } catch (error) {
        console.error('Error creating topic:', error);
    } finally {
        try {
            console.log('Disconnecting Admin...');
            await admin.disconnect();
            console.log('Admin disconnected.');
        } catch (error) {
            console.error('Error disconnecting Admin:', error);
        }
    }
}

init();
