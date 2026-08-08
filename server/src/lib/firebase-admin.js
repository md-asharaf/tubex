import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { ApiError } from "../utils/api-error.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serviceAccountPath = path.resolve(__dirname, "../../serviceAccount.json");
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export const verifyIdToken = async (idToken) => {
  try {
    return await admin.auth().verifyIdToken(idToken);
  } catch (error) {
    throw new ApiError(401, "Invalid Google ID Token");
  }
};