import express from 'express';
import fs from 'fs';
import { Ollama } from 'ollama';
import path from 'path';
import os from 'os';

const app = express();
const port = 4040;

// Middleware to parse incoming requests with JSON payloads
app.use(express.json());

// Handle raw binary image data
app.use(express.raw({ type: 'image/*', limit: '10mb' }));

// Create an instance of the Ollama client
const ollama = new Ollama({ host: 'http://100.74.30.25:11434' });

// Function to describe the image
async function describeImage(filePath) {
  // Read the image file as a binary buffer
  const imageBuffer = fs.readFileSync(filePath);

  // Encode the image buffer as a Base64 string
  const imageBase64 = imageBuffer.toString('base64');

  // Send the request to the Ollama server
  try {
    const output = await ollama.generate({
      model: 'llava:34b',
      prompt: 'Describe this image.',
      images: [imageBase64],
    });

    return output.response;
  } catch (error) {
    throw new Error(`Error: ${error.message}`);
  }
}

// Define a POST route to handle image uploads
app.post('/describe-image', async (req, res) => {
  if (!req.body || !req.headers['content-type'].startsWith('image/')) {
    return res.status(400).send('Invalid image file.');
  }

  const imageBuffer = req.body;
  const tempFilePath = path.join(os.tmpdir(), `upload-${Date.now()}.jpg`);

  // Save the uploaded image to a temporary file
  fs.writeFileSync(tempFilePath, imageBuffer);

  try {
    const description = await describeImage(tempFilePath);
    res.json({ description });
  } catch (error) {
    res.status(500).send(error.message);
  } finally {
    // Clean up the uploaded file
    fs.unlinkSync(tempFilePath);
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
