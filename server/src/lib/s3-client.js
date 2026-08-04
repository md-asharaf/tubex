import {
  S3Client,
  CreateMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
  UploadPartCommand,
  PutObjectCommand,
  GetObjectCommand
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  region: "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.OUTPUT_BUCKET;

const generatePresignedUrlForPartUpload = async (uploadId, partNumber, Key) => {
  try {
    const command = new UploadPartCommand({
      Bucket: BUCKET_NAME,
      Key,
      PartNumber: partNumber,
      UploadId: uploadId,
    });
    const url = await getSignedUrl(s3Client, command, { expiresIn: 60 * 60 });
    return url;
  } catch (error) {
    throw error;
  }
}

export const initiateMultipartUpload = async (Key, ContentType) => {
  try {
    const command = new CreateMultipartUploadCommand({
      Bucket: BUCKET_NAME,
      Key,
      ContentType,
    });
    const response = await s3Client.send(command);
    return response.UploadId;
  } catch (error) {
    throw error;
  }
}

export const startMultipartUploadAndGenerateUrls = async (fileKey, contentType, totalParts) => {
  try {
    const uploadId = await initiateMultipartUpload(fileKey, contentType);
    const presignedUrls = [];
    for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
      const url = await generatePresignedUrlForPartUpload(uploadId, partNumber, fileKey);
      presignedUrls.push(url);
    }
    return { uploadId, presignedUrls };
  } catch (error) {
    throw error;
  }
}

export const completeMultipartUpload = async (uploadId, fileKey, partETags) => {
  try {
    const command = new CompleteMultipartUploadCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
      UploadId: uploadId,
      MultipartUpload: { Parts: partETags },
    });
    const response = await s3Client.send(command);
    return response;
  } catch (error) {
    throw error;
  }
}

export const abortMultipartUpload = async (uploadId, fileKey) => {
  try {
    const command = new AbortMultipartUploadCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
      UploadId: uploadId,
    });
    const response = await s3Client.send(command);
    return response;
  } catch (error) {
    throw error;
  }
}

export const putObjectUrl = async (fileKey, contentType, type = "", id = "") => {
  try {
    const metadata = type === 'video' ? { "videoid": String(id) } : type === 'short' ? { "shortid": String(id) } : {};
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
      ContentType: contentType,
      Metadata: metadata
    });
    const url = await getSignedUrl(s3Client, command, { expiresIn: 60 * 10 });
    return url;
  } catch (error) {
    throw error;
  }
}

export const getObjectAsString = async (Key) => {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key,
    });
    const response = await s3Client.send(command);
    const bodyString = await response.Body.transformToString();
    return bodyString;
  } catch (error) {
    throw error;
  }
}
