import { GoogleGenerativeAI } from "@google/generative-ai";
import { logger } from "../utils/logger.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export const generateMetadataFromSubtitleStream = async (subtitleText) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      logger.warn("GEMINI_API_KEY is not set. Skipping LLM generation.");
      return null;
    }

    const prompt = `
        You are an expert YouTube metadata creator. I will provide you with the subtitles (VTT format) of a video.
        Your task is to analyze the text and generate a catchy, highly clickable title and a detailed description for this video.
        Do not use clickbait, but make it engaging and relevant to the content.
        
        CRITICAL OUTPUT FORMAT:
        You must output the exact text "TITLE: " followed by the title, then on a new line "DESCRIPTION: " followed by the description. Do not output anything else.
        Example:
        TITLE: My Awesome Video
        DESCRIPTION: In this video we explore...
        
        Subtitles:
        ${subtitleText.substring(0, 30000)} // truncate to avoid token limits if extremely long
        `;

    const result = await model.generateContentStream({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
      },
    });

    return result.stream;
  } catch (error) {
    logger.error("Error generating metadata stream with Gemini:", error);
    return null;
  }
};
