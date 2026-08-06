#!/bin/sh

# Exit on error
echo "main.sh execution starting...."
set -e

# Ensure required environment variables are set
if [ -z "$FILE_KEY" ] || [ -z "$INPUT_BUCKET" ] || [ -z "$OUTPUT_BUCKET" ] || [ -z "$HEIGHT" ] || [ -z "$WIDTH" ] || [ -z "$IS_SHORT" ]; then
    echo "Error: FILE_KEY, INPUT_BUCKET, OUTPUT_BUCKET, HEIGHT, and WIDTH must be set."
    exit 1
fi

# Define base name from the FILE_KEY
FILENAME=$(basename "$FILE_KEY")
BASE_NAME="${FILENAME%.*}"

# Define input and output paths
INPUT_FILE="https://s3.ap-south-1.amazonaws.com/${INPUT_BUCKET}/${FILE_KEY}"
OUTPUT_PATH="s3://${OUTPUT_BUCKET}/${BASE_NAME}"
HEIGHT=$((HEIGHT))  # Convert to integer
WIDTH=$((WIDTH))    # Convert to integer
IS_SHORT=$((IS_SHORT))  # Convert to integer
# Create a temporary directory for intermediate files
TEMP_DIR=$(mktemp -d)
if [ ! -d "$TEMP_DIR" ]; then
    echo "Error: Failed to create temporary directory."
    exit 1
fi
generate_master_playlist(){
    # Generate HLS master playlist
    MASTER_PLAYLIST="${TEMP_DIR}/master.m3u8"
    echo "#EXTM3U" > "$MASTER_PLAYLIST"
    echo "#EXT-X-VERSION:3" >> "$MASTER_PLAYLIST"
    if [ "$WIDTH" -ge 640 ] && [ "$HEIGHT" -ge 360 ]; then
        echo "#EXT-X-STREAM-INF:BANDWIDTH=500000,RESOLUTION=640x360" >> "$MASTER_PLAYLIST"
        echo "360p.m3u8" >> "$MASTER_PLAYLIST"
    fi
    if [ "$WIDTH" -ge 854 ] && [ "$HEIGHT" -ge 480 ]; then
        echo "#EXT-X-STREAM-INF:BANDWIDTH=1000000,RESOLUTION=854x480" >> "$MASTER_PLAYLIST"
        echo "480p.m3u8" >> "$MASTER_PLAYLIST"
    fi
    if [ "$WIDTH" -ge 1280 ] && [ "$HEIGHT" -ge 720 ]; then
        echo "#EXT-X-STREAM-INF:BANDWIDTH=2500000,RESOLUTION=1280x720" >> "$MASTER_PLAYLIST"
        echo "720p.m3u8" >> "$MASTER_PLAYLIST"
    fi
    if [ "$WIDTH" -ge 1920 ] && [ "$HEIGHT" -ge 1080 ]; then
        echo "#EXT-X-STREAM-INF:BANDWIDTH=5000000,RESOLUTION=1920x1080" >> "$MASTER_PLAYLIST"
        echo "1080p.m3u8" >> "$MASTER_PLAYLIST"
    fi

    aws s3 cp "$MASTER_PLAYLIST" "$OUTPUT_PATH/master.m3u8" || { echo "Error uploading master.m3u8"; exit 1; }
}
# Function to generate subtitles using Whisper
generate_subtitles() {
    echo "Generating subtitles..."

    # Check if the subtitle file already exists in S3
    SUBTITLE_FILE="${OUTPUT_PATH}/subtitle.vtt"
    if aws s3 ls "$SUBTITLE_FILE" >/dev/null 2>&1; then
        echo "Subtitle file already exists in S3. Skipping transcription."
    else
        # Convert video into mp3
        echo "Extracting audio from video for transcription..."
        ffmpeg -i "$INPUT_FILE" -vn -acodec mp3 "${TEMP_DIR}/subtitle.mp3"
        
        # Transcribe the audio to generate subtitles using Whisper
        echo "Transcribing audio to generate subtitles..."
        time whisper "${TEMP_DIR}/subtitle.mp3" --language en --task transcribe --output_format vtt --model medium --output_dir "${TEMP_DIR}"
        # Copy the generated subtitles to S3
        aws s3 cp "${TEMP_DIR}/subtitle.vtt" "$SUBTITLE_FILE" || { echo "Error uploading subtitle.vtt"; exit 1; }
    fi
}

# Function to generate thumbnails and VTT file
generate_thumbnails_and_vtt() {
    echo "Generating thumbnails and creating VTT file..."

    # Create the VTT file
    VTT_FILE="$TEMP_DIR/thumbnails.vtt"
    echo "WEBVTT" > "$VTT_FILE"
    echo "" >> "$VTT_FILE"

    # Generate thumbnails at 720p resolution for every second (streaming from S3)
    ffmpeg -i "$INPUT_FILE" -vf "fps=1,scale=1280:720" -q:v 2 "$TEMP_DIR/thumbnails_%03d.jpg"

    # Get the total duration of the video
    VIDEO_DURATION=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$INPUT_FILE")
    VIDEO_DURATION=${VIDEO_DURATION%.*}  # Convert to integer by removing decimals

    # Loop through thumbnails and create VTT entries
    for ((i=1; i<=VIDEO_DURATION; i++)); do
        THUMBNAIL_PATH=$(printf "$TEMP_DIR/thumbnails_%03d.jpg" "$i")
        
        # Generate the timestamp for the current second (assuming each thumbnail corresponds to a second)
        START_TIME=$(printf "%02d:%02d:%02d.000" $(($i/3600)) $(($i%3600/60)) $(($i%60)))
        END_TIME=$(printf "%02d:%02d:%02d.000" $(($i/3600)) $(($i%3600/60)) $(($i%60+1)))
        
        # Add the entry to the VTT file
        echo "$START_TIME --> $END_TIME" >> "$VTT_FILE"
        echo "thumbnails_$(printf "%03d" $i).jpg" >> "$VTT_FILE"
        echo "" >> "$VTT_FILE"  # Blank line after each entry
    done

    # Upload thumbnails and VTT to S3
    echo "Uploading thumbnails and VTT to S3..."

    for thumbnail in "$TEMP_DIR"/*.jpg; do
        THUMBNAIL_S3_PATH="$OUTPUT_PATH/thumbnails/$(basename "$thumbnail")"
        aws s3 cp "$thumbnail" "$THUMBNAIL_S3_PATH" || { echo "Error uploading $thumbnail"; exit 1; }
    done

    # Upload VTT file
    aws s3 cp "$VTT_FILE" "$OUTPUT_PATH/thumbnails.vtt" || { echo "Error uploading thumbnails.vtt"; exit 1; }
}
if ((IS_SHORT==0)); then
    echo "Regular video detected. Generating HLS playlist..."
    generate_master_playlist
fi
# Call the function to generate subtitles
generate_subtitles

# Call the function to generate thumbnails and VTT
generate_thumbnails_and_vtt

# Clean up temporary directory
rm -rf "$TEMP_DIR"

echo "main.sh execution completed successfully."
