const AWS = require("aws-sdk");
const { AssemblyAI } = require("assemblyai");

const s3 = new AWS.S3({ region: "ap-south-1" });
const client = new AssemblyAI({
    apiKey: process.env.ASSEMBLYAI_API_KEY,
});
async function getVideoMetadata(Bucket,Key) {
    const params = {
        Bucket,
        Key,
    };
    const data = await s3.headObject(params).promise();
    console.log("Metadata:", data.Metadata);
    return data.Metadata;
}
module.exports.handler = async (event) => {
    let id = "unknown";
    try {
        const eventBody = event.Records[0];
        const FILE_KEY = eventBody.s3.object.key;
        const INPUT_BUCKET = eventBody.s3.bucket.name;
        const audio_url = `https://${INPUT_BUCKET}.s3.amazonaws.com/${FILE_KEY}`;
        const metadata = await getVideoMetadata(INPUT_BUCKET,FILE_KEY);
        id = metadata.shortid || metadata.videoid;
        console.log({
            FILE_KEY,
            INPUT_BUCKET,
            audio_url,
            id
        })
        // Request transcription
        console.log(`Processing file: ${audio_url}`);
        let transcript;
        try {
            transcript = await client.transcripts.transcribe({ audio_url });
        } catch (err) {
            console.error("AssemblyAI Transcription Error:", err);
            await sendWebhook(id,"FAILED");
            return;
        }

        // Get VTT subtitles
        let vttfile;
        try {
            vttfile = await client.transcripts.subtitles(transcript.id, "vtt");
        } catch (err) {
            console.error("AssemblyAI Subtitle Error:", err);
            await sendWebhook(id,"FAILED");
            return;
        }

        // Upload to S3
        const splits = FILE_KEY.split('/');
        splits.pop();
        const outputKey = `${splits.join('/')}/subtitle.vtt`;
        const uploadParams = {
            Bucket: INPUT_BUCKET,
            Key: outputKey,
            Body: vttfile,
            ContentType: "text/vtt"
        };

        try {
            await s3.upload(uploadParams).promise();
            console.log(`Uploaded to s3://${INPUT_BUCKET}/${outputKey}`);
        } catch (err) {
            console.error("S3 Upload Error:", err);
            await sendWebhook(id,"FAILED");
            return;
        }
        await sendWebhook(id,"READY");
    } catch (err) {
        console.error("Unexpected Error:", err);
        await sendWebhook(id,"FAILED");
    }
};

async function sendWebhook(id, status) {
    const webhookUrl = process.env.WEBHOOK_URL;
    if (!webhookUrl) {
        console.error("❌ Webhook URL is missing!");
        return;
    }

    const MAX_RETRIES = 3;
    let attempt = 0;
    let delay = 2000; // Start with 2s delay

    while (attempt < MAX_RETRIES) {
        try {
            const response = await fetch(webhookUrl, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, status }),
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${await response.text()}`);
            }

            console.log(`✅ Webhook sent successfully: ${id}`);
            return;
        } catch (err) {
            attempt++;
            console.error(`❌ Webhook Error (Attempt ${attempt}):`, err.message || err);

            if (attempt === MAX_RETRIES) {
                console.error("🚨 Failed to send webhook after multiple attempts.");
            } else {
                await new Promise(resolve => setTimeout(resolve, delay));
                delay *= 2; // Exponential backoff
            }
        }
    }
}


