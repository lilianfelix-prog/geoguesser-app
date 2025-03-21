/**
 * GeoGuesser Clone using Google Maps and Street View
 */

// Type definitions
interface Location {
    lat: number;
    lng: number;
  }
  
  // Declare Google Maps variables
  let map: google.maps.Map;
  let panorama: google.maps.StreetViewPanorama;
  let marker: google.maps.Marker | null = null;
  let actualMarker: google.maps.Marker | null = null;
  let flightPath: google.maps.Polyline | null = null;
  let currentLocation: Location;
  let actualLocation: Location;
  let guessMode = true;
  let gameScore = 0;
  let currentRound = 0;
  const maxRounds = 5;
  
  // Function to get location from URL parameters (for custom starting points)
  function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const urllat = params.get('urllat');
    const urllng = params.get('urllng');
    
    return { 
      urllat: urllat ? parseFloat(urllat) : null, 
      urllng: urllng ? parseFloat(urllng) : null
    };
  }
  
  // Initialize the map and Street View
  function initialize() {
    // Create API key input form
    const apiLogin = document.createElement("div");
    apiLogin.className = "api-login";
    apiLogin.innerHTML = `
      <div class="api-explanation">
        <h2>Google Maps API Key Required</h2>
        <p>This game uses Google Maps and Street View services. To use these features, you need to provide your own Google Maps API key. You can get one for free from the Google Cloud Console.</p>
        <a href="https://console.cloud.google.com/google/maps-apis/credentials" target="_blank" class="api-link">Get your API key here →</a>
      </div>
      <form id="api-form">
        <label for="key_input">Enter your Google Maps API key:</label>
        <input type="text" id="key_input" name="api-key" required>
        <button type="submit">Submit</button>
      </form>
    `;
    document.body.appendChild(apiLogin);

    const form = document.getElementById("api-form") as HTMLFormElement;
    const keyInput = document.getElementById("key_input") as HTMLInputElement;

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const key = keyInput.value.trim();
      if (key) {
        // Store the API key
        window.googleMapsApiKey = key;
        
        // Remove the form
        apiLogin.remove();
        
        // Load Google Maps API with the user's key
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&callback=initializeMap`;
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);
      }
    });
  }
  
  // Function to initialize the map after API is loaded
  function initializeMap() {
    // Set up the game UI
    setupGameUI();
    
    // Create the map
    map = new google.maps.Map(
      document.getElementById("map") as HTMLElement,
      {
        center: { lat: 0, lng: 0 },
        zoom: 2,
        streetViewControl: false,
        fullscreenControl: false
      }
    );
    
    // Create the Street View panorama
    panorama = new google.maps.StreetViewPanorama(
      document.getElementById("street-view") as HTMLElement,
      {
        position: { lat: 0, lng: 0 },
        pov: { heading: 0, pitch: 0 },
        zoom: 1,
        addressControl: false,
        showRoadLabels: false,
        panControl: true,
        zoomControl: false,
        fullscreenControl: false,
        motionTracking: false,
        motionTrackingControl: false,
        linksControl: true,
        enableCloseButton: false,
        visible: true,
        panControlOptions: {
          position: google.maps.ControlPosition.LEFT_BOTTOM
        }
      }
    );
    
    // Add click event to the map for placing guesses
    map.addListener("click", (event: google.maps.MapMouseEvent) => {
      if (guessMode && event.latLng) {
        placeGuessMarker(event.latLng);
      }
    });
    
    
    // Start the game
    startNewRound();
  }
  
  // Set up the game UI elements
  function setupGameUI() {
    // Add event listeners to the existing buttons
    document.getElementById("guess-btn")?.addEventListener("click", makeGuess);
    document.getElementById("next-btn")?.addEventListener("click", startNewRound);
  }
  
  // Start a new round
  async function startNewRound() {
    // Clear previous markers and lines
    clearMapElements();
    
    // Update game state
    guessMode = true;
    currentRound++;
    updateRoundDisplay();
    
    // Reset buttons
    const guessBtn = document.getElementById("guess-btn") as HTMLButtonElement;
    const nextBtn = document.getElementById("next-btn") as HTMLButtonElement;
    guessBtn.disabled = true;
    nextBtn.disabled = true;
    
    try {
      // Check for URL parameters first
      const { urllat, urllng } = getUrlParams();
      
      if (urllat !== null && urllng !== null) {
        // Use URL parameters if available
        actualLocation = { lat: urllat, lng: urllng };
       
      
      // Create a StreetView service instance
    const streetViewService = new google.maps.StreetViewService();
    const radius = 5000; // Search radius in meters

    // Convert lat/lng to Google Maps LatLng object
    const latLng = new google.maps.LatLng(actualLocation.lat, actualLocation.lng);

    // Search for a nearby Street View panorama
    streetViewService.getPanorama({ location: latLng, radius: radius }, async (data, status) => {
          if (status === google.maps.StreetViewStatus.OK && data && data.location) {
                panorama.setPano(data.location.pano); // Set the found panorama
                panorama.setPov({
                    heading: 0, // Adjust viewpoint
                    pitch: 0,
                });
                panorama.setVisible(true);
          } else {
            console.warn("No Street View found for URL parameters location.");
          }   
    });
    }else{
      await findValidStreetView();  
    }
  }catch (error) {
    console.error('Error fetching location:', error);
    alert('Error fetching location. Please try again.');
  }

}

async function findValidStreetView(): Promise<boolean>{
  // Start with a random location
  try {
    const result = await fetchRandomLocation();
    if (!result) {
      throw new Error('Failed to fetch a valid location.');
    }
    
    actualLocation = result;
    const latLng = new google.maps.LatLng(actualLocation.lat, actualLocation.lng);
    
    // Create a Promise that wraps the callback-based API
    return new Promise<boolean>((resolve, reject) => {
      const streetViewService = new google.maps.StreetViewService();
      streetViewService.getPanorama({ location: latLng, radius: 5000 }, (data, status) => {
        if (status === google.maps.StreetViewStatus.OK && data && data.location) {
          // Success! Set the panorama and resolve
          panorama.setPano(data.location.pano);
          panorama.setPov({
            heading: 0,
            pitch: 0,
          });
          panorama.setVisible(true);
          resolve(true);
        } else if (status === google.maps.StreetViewStatus.ZERO_RESULTS) {
          // Handle rate limiting
          console.warn("Rate limit exceeded, waiting before retry...");
          setTimeout(() => {
            resolve(false);
          }, 2000); // Wait 2 seconds before retrying
        } else {
          // No Street View found, try again with a new location
          console.warn("No Street View found, trying another location...");
          setTimeout(() => {
            resolve(false);
          }, 1000); // Wait 1 second before retrying
        }
      });
    }).then(async (success: Boolean) => {
      if (!success) {
        // If not successful, wait a bit before trying again
        await new Promise(resolve => setTimeout(resolve, 1000));
        return findValidStreetView();
      }
      return true;
    });
  } catch (error) {
    console.error("Error in street view search:", error);
    // Wait before retrying on error
    await new Promise(resolve => setTimeout(resolve, 2000));
    return findValidStreetView();
  }
}

async function fetchRandomLocation() {
  try{
  const response = await fetch('/api/location/random');
  const data = await response.json();
  actualLocation = data.actualLocation;
  return actualLocation;
  }catch (error) {
    console.error('Error fetching location:', error);
    alert('Error fetching location. Please try again.');
  }
}
  // Place a marker on the map for the user's guess
  function placeGuessMarker(position: google.maps.LatLng) {
    // Remove existing marker if any
    if (marker) {
      marker.setMap(null);
    }
    
    // Create a new marker
    marker = new google.maps.Marker({
      position: position,
      map: map
    });
    
    // Enable the guess button
    const guessBtn = document.getElementById("guess-btn") as HTMLButtonElement;
    guessBtn.disabled = false;
  }
  
  // Clear all markers and lines from the map
  function clearMapElements() {
    if (marker) {
      marker.setMap(null);
      marker = null;
    }
    
    if (actualMarker) {
      actualMarker.setMap(null);
      actualMarker = null;
    }
    
    if (flightPath) {
      flightPath.setMap(null);
      flightPath = null;
    }
  }
  
  // Make a guess and calculate score
  async function makeGuess() {
    if (!marker) {
      alert('Please select a location on the map first!');
      return;
    }
    
    guessMode = false;
    
    // Get guess coordinates
    const guessLocation: Location = {
      lat: marker.getPosition()!.lat(),
      lng: marker.getPosition()!.lng()
    };
    
    try {
      // Calculate distance and score
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
      
      // Update score
      gameScore += result.score;
      updateScoreDisplay(result.score, result.distance);
      
      // Show actual location
      showResult(guessLocation, actualLocation);
      
      // Enable next button if not final round
      const nextBtn = document.getElementById("next-btn") as HTMLButtonElement;
      
      if (currentRound < maxRounds) {
        nextBtn.disabled = false;
      } else {
        // Game over
        setTimeout(() => {
          alert(`Game over! Final score: ${gameScore}. Play again?`);
          // Reset game
          gameScore = 0;
          currentRound = 0;
          startNewRound();
        }, 2000);
      }
    } catch (error) {
      console.error('Error calculating score:', error);
      alert('Error processing your guess. Please try again.');
    }
  }
  
  // Show the result of the guess
  function showResult(guessLocation: Location, actualLocation: Location) {
    // Place a marker at the actual location
    const actualLatLng = new google.maps.LatLng(
      Number(actualLocation.lat), 
      Number(actualLocation.lng)
    );
    actualMarker = new google.maps.Marker({
      position: actualLatLng,
      map: map,
      icon: {
        url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png'
      }
    });
    
    // Draw a line between the guess and actual location
    flightPath = new google.maps.Polyline({
      path: [
        { lat: guessLocation.lat, lng: guessLocation.lng },
        { lat: actualLatLng.lat(), lng: actualLatLng.lng() }
      ],
      geodesic: true,
      strokeColor: '#FF0000',
      strokeOpacity: 1.0,
      strokeWeight: 2
    });
    
    flightPath.setMap(map);
    
    // Fit the map to show both markers
    const bounds = new google.maps.LatLngBounds();
    bounds.extend(new google.maps.LatLng(guessLocation.lat, guessLocation.lng));
    bounds.extend(new google.maps.LatLng(actualLocation.lat, actualLocation.lng));
    map.fitBounds(bounds);
  }
  
  // Update the score display
  function updateScoreDisplay(roundScore: number, distance: number) {
    const scoreElement = document.getElementById("score");
    const distanceElement = document.getElementById("distance");
    
    if (scoreElement) {
      scoreElement.innerHTML = `${gameScore} <span class="score-change">(+${roundScore})</span>`;
    }
    
    if (distanceElement) {
      distanceElement.innerHTML = `<span class="distance-value">${Math.round(distance).toLocaleString()}</span> km`;
    }
  }
  
  // Update the round display
  function updateRoundDisplay() {
    const roundElement = document.getElementById("round");
    const distanceElement = document.getElementById("distance");
    
    if (roundElement) {
      roundElement.textContent = `${currentRound}/${maxRounds}`;
    }

    // Clear the distance when starting a new round
    if (distanceElement) {
      distanceElement.textContent = "-";
    }
  }
  
  // Define the window interface to expose the initialize functions
  declare global {
    interface Window {
      initialize: () => void;
      initializeMap: () => void;
      googleMapsApiKey: string;
    }
  }
  
  // Export the initialize function to the global scope
  window.initialize = initialize;
  window.initializeMap = initializeMap;
  
  // For module system
  export {};