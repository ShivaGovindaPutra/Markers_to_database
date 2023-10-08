// Creating map
const map = L.map('map', {
    center: [-8.601206846576417, 115.20210530710213],
    zoom: 11,
});

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }).addTo(map);


// Call the function to load markers after initializing the map
loadMarkers();

// Creating an array for markers
var markers = [];

var clusters = L.markerClusterGroup();

// If on drag
var isOnDrag = false;

// Add a variable to keep track of the currently dragged marker
var draggedMarker = null;

// pop up content
formatContent = function (lat, lng, district, index) {
    return `
        <div class="popup-content">
            <h3>${district}</h3>
            <div class="info-row">
                <span class="label">Latitude:</span>
                <span class="value">${lat}</span>
            </div>
            <div class="info-row">
                <span class="label">Longitude:</span>
                <span class="value">${lng}</span>
            </div>
            <div class="info-row">
                <span class="label">Left Click:</span>
                <span class="value">New Marker / Show Popup</span>
            </div>
            <div class="info-row">
                <span class="label">Right Click:</span>
                <span class="value">Delete Marker</span>
            </div>
        </div>
    `;
}


function reverseGeocode(latlng, callback) {
    const { lat, lng } = latlng;
    fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`)
        .then((response) => response.json())
        .then((data) => {
            const locationName = data.display_name || 'Location not found';

            callback(locationName);
        })
        .catch((error) => {
            console.error('Error reverse geocoding:', error);
            callback('Location not found');
        });
}

// Function to handle marker creation
function handleMarkerCreation(e) {
    if (!draggedMarker) { // Check if no marker is being dragged
        console.log(isOnDrag);

        // Create a new marker
        var newMarker = addMarker(e.latlng, markers.length);

        // Add the marker to the markers array
        markers.push(newMarker);

        // Add the new marker to the clusters cluster group
        clusters.addLayer(newMarker);

        // Add the clusters cluster group to the map
        map.addLayer(clusters);

        // Get latitude and longitude from the marker
        const latlng = newMarker.getLatLng();

        console.log('Latitude:', latlng.lat);
        console.log('Longitude:', latlng.lng);

        // Check if latitude and longitude are valid numbers and not null
        if (!isNaN(latlng.lat) && !isNaN(latlng.lng)) {
            // Save marker data to server
            saveMarkerDataToServer(newMarker);
        } else {
            console.error('Invalid latitude or longitude');
        }

        console.log(markers);
    }
}

// Adding marker
function addMarker(latlng, index) {
    // Add marker with draggable option set to true
    var marker = L.marker(latlng, { draggable: true }).addTo(map);

    // Store the original latitude and longitude as marker options
    marker.options.originalLat = latlng.lat;
    marker.options.originalLng = latlng.lng;

    // Create popup
    var popup = L.popup({ offset: [0, -30] }).setLatLng(latlng);

    // Binding popup to marker
    marker.bindPopup(popup);

    // Add event listener to marker
    // On click
    marker.on('click', function () {
        popup.setLatLng(marker.getLatLng());
        
        // Reverse geocode and set location name in the popup
        reverseGeocode(marker.getLatLng(), function (locationName) {
            popup.setContent(formatContent(marker.getLatLng().lat, marker.getLatLng().lng, locationName, index));
            popup.update();
        });
    });

    // drag start
    marker.on('dragstart', function (event) {
        isOnDrag = true;
        draggedMarker = marker; // Set the currently dragged marker
    });

    // Add event listener to marker
    // On drag
    marker.on('drag', function (event) {
        popup.setLatLng(marker.getLatLng());
        popup.setContent(formatContent(marker.getLatLng().lat, marker.getLatLng().lng, index));
        marker.openPopup();

        // If not on drag, save marker data to the server
        if (!isOnDrag) {
            // Get the old latitude and longitude values from the marker
            const oldLat = marker._latlng.lat; // Use the old latitude value
            const oldLng = marker._latlng.lng; // Use the old longitude value

            // Update the marker's position in the database
            updateMarkerPosition(marker, oldLat, oldLng);
        }
    });

    // drag end
    marker.on('dragend', function (event) {
        isOnDrag = false;

        // Update the marker's position in the database
        updateMarkerPosition(marker);
        draggedMarker = null; // Reset the currently dragged marker
    });

    // Remove the marker from the map and the markers array
    marker.on('contextmenu', function (event) {
        // Get latitude and longitude from the marker
        const latlng = marker.getLatLng();
        const lat = latlng.lat;
        const lng = latlng.lng;
    
        // Call the function to delete the marker
        deleteMarker(marker);
    
        // Remove the marker from the map and the markers array
        map.removeLayer(marker);
        markers.splice(index, 1);
        console.log(markers);
    });    

    // Return marker
    return marker;
}

function saveMarkerDataToServer(marker) {
    const latlng = marker.getLatLng();
    const data = new URLSearchParams();
    data.append('lat', latlng.lat);
    data.append('lng', latlng.lng);

    fetch('save.php', {
        method: "POST",
        body: data, // Send data as URL-encoded form data
    })
    .then((response) => {
        if (!response.ok) {
            // Handle HTTP errors
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json(); // Read the response as JSON
    })
    .then((result) => {
        console.log('Data saved successfully:', result);
    })
    .catch((error) => {
        console.error('Error saving data : ', error);
    });
    console.log('Data being sent:', data.toString());
}

// Function to load markers from JSON data and add them to the map
function loadMarkers() {
    fetch('load.php')
        .then((response) => response.json())
        .then((data) => {
            data.forEach((item, index) => {
                const lat = parseFloat(item.latitude);
                const lng = parseFloat(item.longitude);

                if (!isNaN(lat) && !isNaN(lng)) {
                    const latlng = L.latLng(lat, lng);
                    const newMarker = addMarker(latlng, markers.length);
                    markers.push(newMarker);
                    clusters.addLayer(newMarker);
                }
            });
        })
        .catch((error) => {
            console.error('Error loading markers:', error);
        });
}

// detele marker from database
function deleteMarker(marker) {
    // Get latitude and longitude from the marker
    const latlng = marker.getLatLng();
    const lat = latlng.lat;
    const lng = latlng.lng;

    // Send a request to delete the marker from the database
    fetch('delete.php', {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: `lat=${lat}&lng=${lng}`
    })
    .then((response) => {
        if (!response.ok) {
            // Handle HTTP errors
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json(); // Read the response as JSON
    })
    .then((result) => {
        console.log('Data deleted successfully:', result);
        
        // Remove the marker from the map and the markers array
        map.removeLayer(marker);
        markers.splice(markers.indexOf(marker), 1);
    })
    .catch((error) => {
        console.error('Error deleting data:', error);
    });
}

// Add event listener to map
// On click
map.on('click', function (e) {
    // Handle marker creation on a click event only if not on drag and no marker is already being dragged
    if (!isOnDrag && !draggedMarker) {
        handleMarkerCreation(e);
    }
});

// On drag start
map.on('dragstart', function (e) {
    isOnDrag = true;

    // Get the marker being dragged
    draggedMarker = e.target;
    draggedMarker.closePopup(); // Close the popup during drag
});

// On drag
map.on('drag', function (e) {
    // Handle marker dragging (if needed)
});

// On drag end
map.on('dragend', function (e) {
    isOnDrag = false;

    if (draggedMarker) {
        // Update the marker's position in the database
        draggedMarker.openPopup(); // Reopen the popup after drag
        draggedMarker = null; // Reset the currently dragged marker
    }
});

