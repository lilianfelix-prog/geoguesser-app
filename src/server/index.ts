// src/server/index.ts
import { Hono } from 'hono';
import { serveStatic } from 'hono/bun';
import { cors } from 'hono/cors';

// Simple in-memory cache for locations
const locationsCache = new Map();

const app = new Hono();

// CORS and middleware
app.use('*', cors());
app.use('/public/*', serveStatic({ root: './' }));
app.get('/', serveStatic({ path: './public/index.html' }));

// API routes
app.route('/api', new Hono()
  // Get a random location
  .get('/location/random', async (c) => {
    // For demo purposes, return a random location from a predefined list
    // In production, you'd want to implement a more sophisticated selection
    const locations = [
      { lat: 40.712776, lng: -74.005974 }, // New York
      { lat: 51.507351, lng: -0.127758 },  // London
      { lat: 35.689487, lng: 139.691711 }, // Tokyo
      { lat: -33.868820, lng: 151.209290 }, // Sydney
      { lat: 48.856613, lng: 2.352222 }     // Paris
    ];
    
    const randomIndex = Math.floor(Math.random() * locations.length);
    return c.json({ 
      success: true, 
      location: locations[randomIndex],
      // Don't send this to the client in a real app!
      // This is just for demonstration purposes
      actualLocation: locations[randomIndex] 
    });
  })
  
  // Submit a guess
  .post('/guess', async (c) => {
    const { guessLocation, actualLocation } = await c.req.json();
    
    // Calculate distance between guess and actual location
    // This is a simplified version - you'd want a proper haversine formula
    const distance = calculateDistance(
      guessLocation.lat, 
      guessLocation.lng, 
      actualLocation.lat, 
      actualLocation.lng
    );
    
    // Calculate score based on distance (inverse relationship)
    const maxScore = 5000;
    const maxDistance = 20000; // in km
    const score = Math.max(0, Math.round(maxScore * (1 - distance / maxDistance)));
    
    return c.json({ success: true, distance, score });
  })
);


// Helper function to calculate distance between two points
interface Location {
    lat: number;
    lng: number;
}

interface GuessRequest {
    guessLocation: Location;
    actualLocation: Location;
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
        Math.sin(dLon / 2) * Math.sin(dLon / 2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
    const distance = R * c; // Distance in km
    return distance;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI/180);
}

// Start server
const port = process.env.PORT || 3000;
console.log(`Server running at http://localhost:${port}`);

export default {
  port,
  fetch: app.fetch
};