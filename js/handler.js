const roskildeSt = { lat: 55.6401, lon: 12.0804 }; // Roskilde St. coordinates
const borup = { lat: 55.4959, lon: 11.9778 }; // Borup St. coordinates

const subtractedMinutes = 15; // Subtract 15 minutes from current time

const container = document.getElementById('tripsContainer'); // Get the trips container

// Get current date and time
let now = new Date();

// Subtract 15 minutes
now.setMinutes(now.getMinutes() - subtractedMinutes);

// Format time to HH:MM
let time = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');


// Get the user's current location
let originId, destId;
navigator.geolocation.getCurrentPosition(position => {
    const userLocation = { lat: position.coords.latitude, lon: position.coords.longitude };

    // Calculate the distance to Roskilde St. and Borup St.
    const distanceToRoskildeSt = getDistance(userLocation, roskildeSt);
    const distanceToBorup = getDistance(userLocation, borup);

    // Determine the originId and destId based on which location is closer
    if (distanceToRoskildeSt > distanceToBorup) {
         originId = '8600614'; // Id for Borup St.
         destId = '6555'; // Id for Roskilde St.
    } else {
         originId = '6555'; // Id for Roskilde St.
         destId = '8600614'; // Id for Boruå St.
    }

    
    // Fetch trip data from the Rejseplanen API
fetch(`https://xmlopen.rejseplanen.dk/bin/rest.exe/trip?originId=${originId}&destId=${destId}&useBus=0&time=${time}`)
    .then(response => response.text())
    .then(data => {
        let parser = new DOMParser();
        let xmlDoc = parser.parseFromString(data, "text/xml");

        let trips = xmlDoc.getElementsByTagName('Trip');
        let tripData = [];

        // Extract data from the XML document
        for(let i = 0; i < trips.length; i++) {
            let trip = trips[i];
            let origin = trip.getElementsByTagName('Origin')[0];
            let destination = trip.getElementsByTagName('Destination')[0];

            let originTime = origin.getAttribute('rtTime') || origin.getAttribute('time');
            let destinationTime = destination.getAttribute('rtTime') || destination.getAttribute('time');

            let originDelayText = origin.getAttribute('rtTime') ? getDelay(origin.getAttribute('rtTime'), origin.getAttribute('time')) : '';
            let destinationDelayText = destination.getAttribute('rtTime') ? getDelay(destination.getAttribute('rtTime'), destination.getAttribute('time')) : '';

            // Push the data to the tripData array
            tripData.push({
                origin: {
                    name: origin.getAttribute('name'),
                    time: originTime,
                    track: origin.getAttribute('rtTrack') || origin.getAttribute('track'),
                    delayed: origin.getAttribute('rtTime') !== null,
                    delayText: originDelayText
                },
                destination: {
                    name: destination.getAttribute('name'),
                    time: destinationTime,
                    track: destination.getAttribute('rtTrack') || destination.getAttribute('track'),
                    delayed: destination.getAttribute('rtTime') !== null,
                    delayText: destinationDelayText
                }
            });
        }

            // Format the trip data in divs
            container.innerHTML = '';
            tripData.forEach((trip, index) => {
                const tripClass = window.innerWidth <= 768 ? 'trip-mobile' : 'trip-desktop';
                const originDelayClass = trip.origin.delayed ? '' : 'transparent';
                const destinationDelayClass = trip.destination.delayed ? '' : 'transparent';

                const tripElement = `
                <div class="${tripClass} trip ${index + 1}">
                    <div class="title_time">
                        <h2 class="station">${trip.origin.name.slice(0, -1)}:</h2>
                        <span class="tooltip-container">
                            <span class="delay-indicator ${originDelayClass}">+${(typeof trip.origin.delayText === 'string' && trip.origin.delayText.match(/\d+/g) && trip.origin.delayText.match(/\d+/g).join('')) || '0'}</span>
                            <i class="fa-regular fa-clock ${originDelayClass}"></i>
                            <span class="tooltip-text">${trip.origin.delayText}</span>
                            <h2 id="title_time">${trip.origin.time}</h2>
                        </span>
                    </div>
                    <p class="track">Spor: ${trip.origin.track}</p>
                    <i class="fa-solid fa-angles-down"></i>
                    <div class="title_time">
                        <h2 class="station">${trip.destination.name.slice(0, -1)}:</h2>
                        <span class="tooltip-container">
                            <span class="delay-indicator ${destinationDelayClass}">+${(typeof trip.destination.delayText === 'string' && trip.destination.delayText.match(/\d+/g) && trip.destination.delayText.match(/\d+/g).join('')) || '0'}</span>
                            <i class="fa-regular fa-clock ${destinationDelayClass}"></i>
                            <span class="tooltip-text">${trip.destination.delayText}</span>
                            <h2 id="title_time">${trip.destination.time}</h2>
                        </span>
                    </div>
                    <p class="track">Spor: ${trip.destination.track}</p>
                </div>
                `;

                // Load animations
                removePlaceholder()
                deleteElements();
                animateTime();
                container.innerHTML += tripElement;
            });
        })
        .catch(error => console.error('Error:', error));
    });

// Get delay data for tooltips
function getDelay(rtTime, time) {
        let rtTimeDate = new Date(`1970-01-01T${rtTime}:00`);
        let timeDate = new Date(`1970-01-01T${time}:00`);
        let delay = (rtTimeDate - timeDate) / 60000; // Convert milliseconds to minutes
        let delayText = delay === 1 ? `Forsinket:<br> ${delay} minut` : `Forsinket:<br> ${delay} minutter`;
        return delayText;
        
}

// Updates the trip data when refresh button is pressed
function getData() {
    // Get current date and time
    let now = new Date();

    // Subtract 15 minutes
    now.setMinutes(now.getMinutes() - subtractedMinutes);

    // Format time to HH:MM
    let time = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
    console.log(time);

    // Fetch trip data from the Rejseplanen API
    fetch(`https://xmlopen.rejseplanen.dk/bin/rest.exe/trip?originId=${originId}&destId=${destId}&useBus=0&time=${time}`)
        .then(response => response.text())
        .then(data => {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(data, "text/xml");

            // Extract the trips from the XML document
            const trips = Array.from(xmlDoc.getElementsByTagName('Trip'));

            // Process each trip
            // Process each trip
            let newContent = '';
            trips.forEach((trip, index) => {
                const origin = trip.getElementsByTagName('Origin')[0];
                const destination = trip.getElementsByTagName('Destination')[0];
                
                const tripClass = window.innerWidth <= 768 ? 'trip-mobile' : 'trip-desktop';
                const originDelayClass = origin.getAttribute('rtTime') ? '' : 'transparent';
                const destinationDelayClass = destination.getAttribute('rtTime') ? '' : 'transparent';
                const originDelayText = origin.getAttribute('rtTime') ? getDelay(origin.getAttribute('rtTime'), origin.getAttribute('time')) : '';
                const destinationDelayText = destination.getAttribute('rtTime') ? getDelay(destination.getAttribute('rtTime'), destination.getAttribute('time')) : '';

                // Format the trip data in divs
                const tripElement = `
                <div id="trips" class="${tripClass} trip ${index + 1}">
                    <div class="title_time">
                        <h2 class="station">${origin.getAttribute('name').slice(0, -1)}:</h2>
                        <span class="tooltip-container">
                            <span class="delay-indicator ${originDelayClass}">+${(typeof originDelayText === 'string' && originDelayText.match(/\d+/g) && originDelayText.match(/\d+/g).join('')) || '0'}</span>
                            <i class="fa-regular fa-clock ${originDelayClass}"></i>
                            <span class="tooltip-text">${originDelayText}</span>
                            <h2 id="title_time">${origin.getAttribute('rtTime') || origin.getAttribute('time')}</h2>
                        </span>
                    </div>
                    <p class="track">Spor: ${origin.getAttribute('rtTrack') || origin.getAttribute('track')}</p>

                    <i class="fa-solid fa-angles-down"></i>

                    <div class="title_time">
                        <h2 class="station">${destination.getAttribute('name').slice(0, -1)}:</h2>
                        <span class="tooltip-container">
                            <span class="delay-indicator ${destinationDelayClass}">+${(typeof destinationDelayText === 'string' && destinationDelayText.match(/\d+/g) && destinationDelayText.match(/\d+/g).join('')) || '0'}</span>
                            <i class="fa-regular fa-clock ${destinationDelayClass}"></i>
                            <span class="tooltip-text">${destinationDelayText}</span>
                            <h2 id="title_time">${destination.getAttribute('rtTime') || destination.getAttribute('time')}</h2>
                        </span>
                    </div>
                    <p class="track">Spor: ${destination.getAttribute('rtTrack') || destination.getAttribute('track')}</p>
                </div>
                `;
                newContent += tripElement;
            });

            container.innerHTML = newContent;
        })
        .catch(error => console.error('Error:', error));
    
}

// Finds refresh button and adds event listener to it
const refreshButton = document.querySelector('.refresh');

let isRefreshing = false;

refreshButton.addEventListener('click', function() {
    if (isRefreshing) return;
    isRefreshing = true;
    this.setAttribute('disabled', 'disabled');

    refresh();
    setTimeout(getData, 0);

    setTimeout(() => {
        
        this.removeAttribute('disabled');
        isRefreshing = false;
    }, 3000);
});

// Calculates the distance between two stations
function getDistance(location1, location2) {
    const R = 6371e3; // metres
    const φ1 = location1.lat * Math.PI/180; // φ, λ in radians
    const φ2 = location2.lat * Math.PI/180;
    const Δφ = (location2.lat-location1.lat) * Math.PI/180;
    const Δλ = (location2.lon-location1.lon) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // in metres
}

// Removes the placeholder divs
function deleteElements() {
    const elements = document.querySelectorAll('.delete');

    elements.forEach(element => {
        element.remove();
    });
}

// Applies special CSS class if the website is added to the home screen on iOS
if (window.navigator.standalone) {
    document.body.classList.add('apple-mobile-web-app');
}