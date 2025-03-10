// src/server/index.ts
import { Hono } from 'hono';
import path from 'path';
import { serveStatic } from 'hono/bun';
import { cors } from 'hono/cors';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const DB_PATH = path.resolve(__dirname, '../db/geoData.db');

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

    const locations = await getRanLocation();
    console.log(locations);
    const { latitude: lat, longitude: lng } = locations;

    return c.json({ 
      success: true, 
      location: { lat, lng },
      actualLocation: { lat, lng }  
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
    
    return c.json({ success: true, distance, score, actualLocation });
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

async function connectToDatabase() {
  try {
    const db = await open({
      filename: DB_PATH,
      driver: sqlite3.Database,
      mode: sqlite3.OPEN_READONLY
    });
    
    console.log('Successfully connected to the database');
    return db;
  } catch (error) {
    console.error('Error connecting to the database:', error);
    throw error;
  }
}


async function getRanLocation() {
  let db;
  try {
    db = await connectToDatabase();
    
    // Use more efficient random selection method
    const location = await db.get(
      'SELECT latitude, longitude FROM positions WHERE rowid = (ABS(RANDOM()) % (SELECT max(rowid) FROM positions) + 1)',
      [],
      { timeout: 2000 } // Reduced timeout since query is more efficient
    );
    
    return location;
  } catch (error) {
    console.error('Error fetching random location:', error);
    throw error;
  } finally {
    // Ensure db is always closed, even if error occurs
    if (db) await db.close();
  }
}