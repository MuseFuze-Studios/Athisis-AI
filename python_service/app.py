from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
import io
from PIL import Image
import re

app = Flask(__name__)
CORS(app) # Enable CORS for all origins

@app.route('/process_image', methods=['POST'])
def process_image():
    data = request.json
    if not data or 'image' not in data:
        return jsonify({"error": "No image provided"}), 400

    try:
        # Decode the base64 image
        image_data_b64 = data['image']
        # Remove the data URI prefix (e.g., "data:image/png;base64,")
        image_data_b64 = re.sub(r'^data:image/.+;base64,', '', image_data_b64)

        print(f"Attempting to decode base64: {image_data_b64[:50]}...") # Print first 50 chars for debugging
        # Pad the base64 string if necessary
        missing_padding = len(image_data_b64) % 4
        if missing_padding != 0:
            image_data_b64 += '=' * (4 - missing_padding)

        try:
            image_bytes = base64.b64decode(image_data_b64)
        except Exception as e:
            print(f"Standard base64 decode failed: {e}. Trying URL-safe.")
            try:
                image_bytes = base64.urlsafe_b64decode(image_data_b64)
            except Exception as url_e:
                raise ValueError(f"Both standard and URL-safe base64 decode failed: {url_e}") from url_e
        image = Image.open(io.BytesIO(image_bytes))

        # Placeholder for OpenCV processing
        # In a real scenario, you'd use OpenCV here for analysis
        # For now, we'll just return a dummy description
        width, height = image.size
        image_format = image.format
        mode = image.mode

        description = f"This is an image with dimensions {width}x{height}, format {image_format}, and mode {mode}. (Processed by Python service)"
        print("Here is the description" - description)
        return jsonify({"description": description}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(port=5000, debug=True)
