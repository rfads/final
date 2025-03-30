const express = require('express');
const axios = require('axios');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const speech = require('@google-cloud/speech');

const app = express();
const port = process.env.PORT || 3000;

const GOOGLE_MAPS_API_KEY = 'AIzaSyDsYG6T39ZhP6D83HUoVF1d70RllQdnq2Q';

// Enable CORS for all origins
app.use(cors({
  origin: '*', // This allows all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Set up Google Cloud Speech client
const client = new speech.SpeechClient({
  keyFilename: './key/project-443817-6679ab21cd32.json',
});

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '.wav'); // Ensure .wav extension
  }
});

const upload = multer({ storage: storage });

// Endpoint to handle file uploads
app.post('/uploads', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      throw new Error('File upload failed');
    }
    console.log('Received a request');
    console.log('File details:', req.file);
    const filePath = req.file.path;
    console.log('File saved at:', filePath);

    const file = fs.readFileSync(filePath);
    console.log('File read successfully');
    const audioBytes = file.toString('base64');
    console.log('Audio bytes length:', audioBytes.length);

    const request = {
      audio: {
        content: audioBytes,
      },
      config: {
        encoding: 'LINEAR16',
        sampleRateHertz: 44100,
        languageCode: 'en-US',
        audioChannelCount: 1,
        enableAutomaticPunctuation: true,
        model: 'default',
        useEnhanced: true,
        enableWordTimeOffsets: false,
      },
    };

    console.log('Sending request to Google API');

    try {
      const [response] = await client.recognize(request);
      console.log('Raw API Response:', JSON.stringify(response, null, 2));

      if (!response.results || response.results.length === 0) {
        console.log('No transcription results returned');
        return res.json({ 
          transcription: '',
          error: 'No speech detected in the audio'
        });
      }

      const transcription = response.results
        .map(result => result.alternatives[0].transcript)
        .join('\n');

      console.log('Transcription:', transcription);

      res.json({ transcription });
    } catch (speechError) {
      console.error('Google Speech API Error:', speechError);
      res.status(500).json({ 
        error: 'Speech-to-Text API error',
        details: speechError.message 
      });
    }

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ 
      error: 'Server error',
      details: error.message 
    });
  }
});

app.get('/api/places', async (req, res) => {
  try {
    const { lat, lng, radius, type, keyword = 'accessible wheelchair' } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const searchParams = {
      location: `${lat},${lng}`,
      radius: radius || 5000,
      key: GOOGLE_MAPS_API_KEY
    };

    // Add type if provided
    if (type) searchParams.type = type;
    
    // First try with accessibility keyword
    if (keyword) {
      searchParams.keyword = `${keyword} ${type || ''}`.trim();
    }

    console.log('Searching with params:', searchParams); // Debug log

    const response = await axios.get('https://maps.googleapis.com/maps/api/place/nearbysearch/json', {
      params: searchParams
    });

    // If no results found with accessibility keyword, try without it
    if (!response.data.results || response.data.results.length === 0) {
      console.log('No accessible places found, trying without accessibility keyword');
      delete searchParams.keyword;
      const fallbackResponse = await axios.get('https://maps.googleapis.com/maps/api/place/nearbysearch/json', {
        params: searchParams
      });
      return res.json(fallbackResponse.data);
    }

    console.log(`Found ${response.data.results.length} places`);
    res.json(response.data);
  } catch (error) {
    console.error('Server error:', error.message);
    res.status(500).json({ 
      error: 'Error fetching places',
      message: error.message 
    });
  }
});

// Add a test endpoint to verify the server is running
app.get('/test', (req, res) => {
  res.json({ message: 'Server is running!' });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
