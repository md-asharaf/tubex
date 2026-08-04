import { Video } from "../models/video.js";
import { Short } from "../models/short.js";
import { getCache, removeCache, setCache } from "../lib/redis.js";
import { logger } from "../utils/logger.js";

class WebhookController {
  updateTranscodingStatus = async (req, res) => {
    try {
      const { resolution, id } = req.body;
      let cache = await getCache(id);

      if (!cache) {
        cache = {
          "480p": false,
          "720p": false,
          "1080p": false,
        };
      }

      cache[resolution] = true;
      //check if all true
      for (const key in cache) {
        if (!cache[key]) {
          setCache(id, cache);
          return res.status(200).json({ success: true, message: `${resolution} resolution cached successfully` });
        }
      }
      //all true
      await removeCache(id);
      const document = await Video.findById(id) || await Short.findById(id);
      document.sourceStatus = "READY";
      await document.save();
      return res.status(200).json({ success: true, message: "Transcription updated successfully" });
    } catch (error) {
      logger.error(`Error in updateTranscodingStatus: ${error.message}`, error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  updateTranscriptionStatus = async (req, res) => {
    try {
      const { status, id } = req.body;
      const document = await Video.findById(id) || await Short.findById(id);
      document.subtitleStatus = status;
      await document.save();

      return res.status(200).json({ success: true, message: "Audio processing updated successfully" });
    } catch (error) {
      logger.error(`Error in updateTranscriptionStatus: ${error.message}`, error);
      if (!res.headersSent) {
        return res.status(500).json({ success: false, message: error.message });
      }
    }
  }

  updateTitleAndDescStatus = async (req, res) => {
    try {
      const { title, description, id } = req.body;
      const document = await Video.findById(id) || await Short.findById(id);
      document.title = title;
      document.description = description;
      await document.save();
      return res.status(200).json({ success: true, message: "Title and Description updated successfully" });
    } catch (error) {
      logger.error(`Error in updateTitleAndDescStatus: ${error.message}`, error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}

export const webhookController = new WebhookController();