const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
const port = 3000;

app.use(cors());

app.get('/api/places', async (req, res) => {
  try {
    const { lat, lng, radius, type, keyword = 'accessible wheelchair' } = req.query;

    
    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    
    const searchParams = {
      location: `${lat},${lng}`,
      radius: radius || 1500, 
      key: "AIzaSyDsYG6T39ZhP6D83HUoVF1d70RllQdnq2Q"
    };

    if (type) searchParams.type = type;
    if (keyword) searchParams.keyword = keyword;

    const response = await axios.get('https://maps.googleapis.com/maps/api/place/nearbysearch/json', {
      params: searchParams
    });

    
    if (!response.data.results || response.data.results.length === 0) {
      if (type && keyword) {
        const fallbackResponse = await axios.get('https://maps.googleapis.com/maps/api/place/nearbysearch/json', {
          params: {
            ...searchParams,
            type: undefined, 
            keyword: `${keyword} ${type}` 
          }
        });
        return res.json(fallbackResponse.data);
      }
    }

    res.json(response.data);
  } catch (error) {
    console.error('Server error:', error.message);
    res.status(500).json({ 
      error: 'Error fetching places',
      message: error.message 
    });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);  
});
