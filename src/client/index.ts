// src/client/index.ts
// This will be bundled to public/client.js

import  L  from 'leaflet';

// Mock for street view data - in a real app, you'd use Mapillary or another provider
const mapillaryImages: { [key: string]: string } = {
    // New York
    "40.712776,-74.005974": "https://drive.mapillary.com/thumbnail/u0ipI5PV6k8XlI5znVKVMw/thumb-2048.jpg",
    // London
    "51.507351,-0.127758": "https://drive.mapillary.com/thumbnail/wy-7DX7Ro5-VYzHgRnJU8g/thumb-2048.jpg",
    // Tokyo
    "35.689487,139.691711": "https://drive.mapillary.com/thumbnail/YPOjnbzLKFpdvLdQxOZ4uw/thumb-2048.jpg",
    // Sydney
    "-33.86882,151.20929": "https://drive.mapillary.com/thumbnail/j4FH_Si5ZX4nAiONWFjQ3A/thumb-2048.jpg",
    // Paris
  };
  
  interface Location {
    lat: number;
    lng: number;
  }
  // Game state
  let map: L.Map;
  let marker: L.Marker | null = null;
  let currentLocation: Location;
  let actualLocation: Location;
  let guessMode = true;
  let totalScore = 0;
  
  // DOM elements
  const streetviewElement = document.getElementById('streetview') as HTMLDivElement;
  const guessButton = document.getElementById('guess-btn') as HTMLButtonElement;
  const nextButton = document.getElementById('next-btn') as HTMLButtonElement;
  const scoreElement = document.getElementById('score') as HTMLDivElement;
  
  // Initialize map
  function initMap() {
    // Create map centered on Europe
    map = L.map('map').setView([30, 0], 2);
    
    // Add tile layer (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    
    // Add click handler for map
    map.on('click', function(e) {
      if (guessMode) {
        if (marker) marker.remove();
        marker = L.marker(e.latlng).addTo(map);
      }
    });
    
    // Load first location
    loadNewLocation();
  }
  
  // Load a new random location
  async function loadNewLocation() {
    guessMode = true;
    if (marker) marker.remove();
    
    try {
      // Fetch random location from API
      const response = await fetch('/api/location/random');
      const data = await response.json();
      
      currentLocation = data.location;
      actualLocation = data.actualLocation; // In a real app, this would be kept server-side
      
      // Display street view image
      // In a real app, you'd use the Mapillary viewer SDK instead of this simplified approach
      const locationKey = `${currentLocation.lat},${currentLocation.lng}`;
      const imageUrl = mapillaryImages[locationKey] || 'placeholder.jpg';
      
        streetviewElement.innerHTML = `<img src="${imageUrl}" alt="Street View" />`;
      
      
      // Reset UI
      guessButton.disabled = false;
      nextButton.disabled = true;
      
    } catch (error) {
      console.error('Error loading location:', error);
      streetviewElement.innerHTML = '<p>Error loading street view. Please try again.</p>';
    }
  }
  
  // Handle guess submission
  async function makeGuess() {
    if (!marker) {
      alert('Please select a location on the map first!');
      return;
    }
    
    guessMode = false;
    guessButton.disabled = true;
    
    const guessLocation = {
      lat: marker.getLatLng().lat,
      lng: marker.getLatLng().lng
    };
    
    try {
      // Submit guess to API
      const response = await fetch('/api/guess', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          guessLocation,
          actualLocation
        })
      });
      
      const result = await response.json();
      
      // Show actual location on map
      L.marker([actualLocation.lat, actualLocation.lng], {
        icon: L.icon({
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.3/images/marker-icon.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.3/images/marker-shadow.png',
          shadowSize: [41, 41]
        })
      }).addTo(map);
      
      // Draw line between guess and actual location
      L.polyline([
        [guessLocation.lat, guessLocation.lng],
        [actualLocation.lat, actualLocation.lng]
      ], {color: 'red'}).addTo(map);
      
      // Update score
      totalScore += result.score;
      scoreElement.textContent = `Score: ${totalScore} (+${result.score}) - Distance: ${Math.round(result.distance)} km`;
      
      // Enable next button
      nextButton.disabled = false;
      
    } catch (error) {
      console.error('Error submitting guess:', error);
      alert('Error submitting guess. Please try again.');
    }
  }
  
  // Event listeners
  document.addEventListener('DOMContentLoaded', initMap);
  guessButton.addEventListener('click', makeGuess);
  nextButton.addEventListener('click', loadNewLocation);