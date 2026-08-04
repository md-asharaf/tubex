const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const util = require('util');
const { exec } = require('child_process');
const execPromise = util.promisify(exec)
const ecs = new AWS.ECS({ region: 'ap-south-1' });
const s3 = new AWS.S3({ region: 'ap-south-1' });

module.exports.handler = async (event) => {
  try {
    const eventBody = JSON.parse(event.Records[0].body);
    const FILE_KEY = eventBody.Records[0].s3.object.key;
    const INPUT_BUCKET = eventBody.Records[0].s3.bucket.name;
    const OUTPUT_BUCKET = process.env.OUTPUT_BUCKET;
    const BASE_NAME = path.parse(FILE_KEY).name;
    const TEMP_DIR = `/tmp/${BASE_NAME}`;
    const inputPath = `/tmp/${path.basename(FILE_KEY)}`;
    const audioOutputPath = `/tmp/${BASE_NAME}.mp3`;
    const metadata = await getVideoMetadata(INPUT_BUCKET, FILE_KEY);
    const id = metadata.shortid || metadata.videoid;
    const filenameParts = BASE_NAME.split('_');
    const WIDTH = parseInt(filenameParts[filenameParts.length - 2], 10);
    const HEIGHT = parseInt(filenameParts[filenameParts.length - 1], 10);
    const isShort = FILE_KEY.startsWith('uploads/shorts');

    console.log({
      FILE_KEY,
      INPUT_BUCKET,
      OUTPUT_BUCKET,
      BASE_NAME,
      TEMP_DIR,
      inputPath,
      audioOutputPath,
      WIDTH,
      HEIGHT,
      id,
      isShort
    })
    fs.mkdirSync(TEMP_DIR, { recursive: true });
    // download video first
    await downloadVideo(INPUT_BUCKET, FILE_KEY,inputPath);
    // start ecs tasks
    await startEcsTasks(isShort, HEIGHT, WIDTH, FILE_KEY, INPUT_BUCKET, id);
    // extract audio 
    await extractAudio(inputPath, audioOutputPath, BASE_NAME, OUTPUT_BUCKET, id);
    // generate HLS master playlist
    await generateHLSMasterPlaylist(BASE_NAME, TEMP_DIR, OUTPUT_BUCKET, WIDTH, HEIGHT);
    // generate thumbnails & VTT
    await generateThumbnailsAndVTT(inputPath, TEMP_DIR, BASE_NAME, OUTPUT_BUCKET);
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Processing started...' }),
    }
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: error.message }),
    }
  };
}

// Resolutions for transcoding
const resolutions = [
  { height: 360, bandwidth: 500, width: 640 },
  { height: 480, bandwidth: 1000, width: 854 },
  { height: 720, bandwidth: 2500, width: 1280 },
  { height: 1080, bandwidth: 5000, width: 1920 },
];
// Download video
const downloadVideo = async (inputBucket, inputKey,inputPath) => {
    console.log(`Downloading from S3: ${inputBucket}/${inputKey}`);
    const file = await s3.getObject({ Bucket: inputBucket, Key: inputKey }).promise();
    fs.writeFileSync(inputPath, file.Body);
}

// Start ECS tasks
const startEcsTasks = async (isShort, height, width, file_key, input_bucket, id) => {
    console.log('Starting ECS tasks...');
    if (isShort) {
      console.log(`Video is a Short, starting transcoding task with the uploaded resolution...`);
      const shortParams = getTranscodingParams(parseInt(height), 2500, parseInt(width), file_key, input_bucket, id);
      await ecs.runTask(shortParams).promise().then(
        (data) => {
          const taskArn = data.tasks[0]?.taskArn;
          if (taskArn) {
            console.log(`Transcoding task for Short started successfully with task ARN: ${taskArn}`);
          } else {
            console.error('Failed to retrieve task ARN for Short');
          }
        },
        (err) => {
          console.error('Error starting transcoding task for Short:', err);
          throw err;
        }
      );
    } else {
      console.log('Video is a regular video, starting transcoding tasks for multiple resolutions...');
      const filteredResolutions = resolutions.filter(
        (resolution) => resolution.height <= parseInt(maxHeight)
      );

      const transcodingPromises = filteredResolutions.map((resolution) => {
        const params = getTranscodingParams(
          resolution.height,
          resolution.bandwidth,
          resolution.width,
          file_key,
          input_bucket,
          id
        );
        console.log(
          `Starting transcoding task for ${resolution.width}X${resolution.height} resolution...`
        );
        return ecs.runTask(params).promise().then(
          (data) => {
            const taskArn = data.tasks[0]?.taskArn;
            if (taskArn) {
              console.log(
                `Transcoding task for ${resolution.width}X${resolution.height} started successfully with task ARN: ${taskArn}`
              );
            } else {
              console.error(
                `Failed to retrieve task ARN for ${resolution.width}X${resolution.height} REASON:`, data.failures[0]?.reason
              );
            }
          },
          (err) => {
            console.error(
              `Error starting transcoding task for ${resolution.width}X${resolution.height}:`,
              err
            );
            throw err;
          }
        );
      });
      await Promise.all(transcodingPromises);
    }
    console.log('ECS tasks triggered successfully.');
}

// Get video metadata
const getVideoMetadata = async (Bucket, Key) => {
    const params = {
      Bucket,
      Key,
    };
    const data = await s3.headObject(params).promise();
    console.log("Metadata:", data.Metadata);
    return data.Metadata;
}

// Get transcoding params
const getTranscodingParams = (height, bandwidth, width, fileKey, inputBucket, id) => ({
  cluster: process.env.CLUSTER_ARN,
  taskDefinition: process.env.TRANSCODING_TASK_ARN,
  count: 1,
  launchType: 'FARGATE',
  networkConfiguration: {
    awsvpcConfiguration: {
      subnets: [process.env.SUBNET_ID],
      assignPublicIp: 'ENABLED',
    },
  },
  overrides: {
    containerOverrides: [
      {
        name: 'transcoding-container',
        environment: [
          { name: 'FILE_KEY', value: fileKey },
          { name: 'INPUT_BUCKET', value: inputBucket },
          { name: 'HEIGHT', value: height.toString() },
          { name: 'BANDWIDTH', value: bandwidth.toString() },
          { name: 'WIDTH', value: width.toString() },
          { name: 'ID', value: id.toString() },
        ],
      },
    ],
  },
});

// Generate Thumbnails & VTT
const generateThumbnailsAndVTT = async (inputPath, tempDir, baseName, outputBucket) => {
    console.log("Generating thumbnails and VTT...");

    const VTT_FILE = path.join(tempDir, 'thumbnails.vtt');
    fs.writeFileSync(VTT_FILE, "WEBVTT\n\n");

    // Generate thumbnails at 1 frame per second
    await execPromise(`ffmpeg -i ${inputPath} -vf "fps=1,scale=320:-1" -q:v 2 ${tempDir}/thumb_%03d.jpg`);

    console.log("Uploading thumbnails and VTT to S3...");

    const thumbnailFiles = fs.readdirSync(tempDir).filter(file => file.startsWith('thumb_') && file.endsWith('.jpg'));

    thumbnailFiles.forEach((file, index) => {
      const timestamp = formatTimestamp(index);
      fs.appendFileSync(VTT_FILE, `${timestamp} --> ${formatTimestamp(index + 1)}\n${file}\n\n`);
    });

    // Upload thumbnails to S3
    for (const file of thumbnailFiles) {
      await s3.putObject({
        Bucket: outputBucket,
        Key: `${baseName}/thumbnails/${file}`,
        Body: fs.readFileSync(path.join(tempDir, file)),
        ContentType: "image/jpeg",
      }).promise();
    }

    // Upload VTT file
    await s3.putObject({
      Bucket: outputBucket,
      Key: `${baseName}/thumbnails/thumbnails.vtt`,
      Body: fs.readFileSync(VTT_FILE),
      ContentType: "text/vtt",
    }).promise();

    console.log(`Uploaded thumbnails and VTT to s3://${outputBucket}/${baseName}/thumbnails/`);
};

// Extract Audio
const extractAudio = async (inputPath, outputPath, baseName, outputBucket, id) => {
    console.log("Extracting audio...");

    await execPromise(`ffmpeg -i ${inputPath} -vn -acodec libmp3lame ${outputPath}`);

    await s3.putObject({
      Bucket: outputBucket,
      Key: `${baseName}/audio.mp3`,
      Body: fs.readFileSync(outputPath),
      ContentType: "audio/mpeg",
      Metadata: {
        "id": id
      }
    }).promise();

    console.log("Audio uploaded to S3.");
};

// Generate HLS Master Playlist
const generateHLSMasterPlaylist = async (baseName, tempDir, outputBucket, width, height) => {
    console.log("Generating HLS master playlist...");

    const masterPlaylistPath = path.join(tempDir, 'master.m3u8');
    let masterPlaylistContent = "#EXTM3U\n#EXT-X-VERSION:3\n";

    const resolutions = [
      { width: 640, height: 360, bitrate: 500000, filename: "360p.m3u8" },
      { width: 854, height: 480, bitrate: 1000000, filename: "480p.m3u8" },
      { width: 1280, height: 720, bitrate: 2500000, filename: "720p.m3u8" },
      { width: 1920, height: 1080, bitrate: 5000000, filename: "1080p.m3u8" },
    ];

    for (const res of resolutions) {
      if (width >= res.width && height >= res.height) {
        masterPlaylistContent += `#EXT-X-STREAM-INF:BANDWIDTH=${res.bitrate},RESOLUTION=${res.width}x${res.height}\n${res.filename}\n`;
      }
    }

    fs.writeFileSync(masterPlaylistPath, masterPlaylistContent);

    await s3.putObject({
      Bucket: outputBucket,
      Key: `${baseName}/master.m3u8`,
      Body: fs.readFileSync(masterPlaylistPath),
      ContentType: "application/x-mpegURL",
    }).promise();

    console.log(`Uploaded master.m3u8 to s3://${outputBucket}/${baseName}/master.m3u8`);
};

// Format timestamps for VTT (e.g., "00:00:01.000")
const formatTimestamp = (index) => {
  const seconds = index;
  const hh = String(Math.floor(seconds / 3600)).padStart(2, '0');
  const mm = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  return `${hh}:${mm}:${ss}.000`;
};