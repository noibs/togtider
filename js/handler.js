// Default ID's:
const roskildeSt = { lat: 55.6401, lon: 12.0804 }; // Roskilde St. coordinates
const borupSt = { lat: 55.4959, lon: 11.9778 }; // Borup St. coordinates
const roskildeId = '6555'; // Id for Roskilde St.
const borupId = '5426'; // Id for Borup St.
const roskilde = 'Roskilde St.'; // Name for Roskilde St.
const borup = 'Borup St.'; // Name for Borup St.

const subtractedMinutes = 15; // Subtract 15 minutes from current time

const container = document.getElementById('tripsContainer'); // Get the trips container

// Get current date and time
let now = new Date();

// Subtract 15 minutes
now.setMinutes(now.getMinutes() - subtractedMinutes);

// Format time to HH:MM
let time = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

// Creates lastIndex for later use
let lastIndex;

// Disable refreshing on load
let isRefreshing = true;
let swapRefreshing = true;


// Get the distance to stations from localStorage
let oLat, oLon, dLat, dLon;
oLat = localStorage.getItem('oLat') || borupSt.lat; // Default latitude for Borup St.*/
oLon = localStorage.getItem('oLon') || borupSt.lon; // Default longitude for Borup St.*/
dLat = localStorage.getItem('dLat') || roskildeSt.lat; // Default latitude for Roskilde St.*/
dLon = localStorage.getItem('dLon') || roskildeSt.lon; // Default longitude for Roskilde St.*/

// Get the user's current location
let originId, destId, originName, destName;

// Load data from localStorage or use default values
originId = localStorage.getItem('originId') || borupId; // Default Id for Borup St.*/
originName = localStorage.getItem('originName') || borup; // Default name for Borup St.*/
destId = localStorage.getItem('destId') || roskildeId; // Default Id for Roskilde St.*/
destName = localStorage.getItem('destName') || roskilde; // Default name for Roskilde St.*/

navigator.geolocation.getCurrentPosition(position => {
    let userLocation = { lat: position.coords.latitude, lon: position.coords.longitude };

    let oCoords = { lat: oLat, lon: oLon };
    let dCoords = { lat: dLat, lon: dLon };

    // Calculate the distance to Roskilde St. and Borup St.
    let distanceToDest = getDistance(userLocation, dCoords);
    let distanceToOrigin = getDistance(userLocation, oCoords);
    
    // Determine the originId and destId based on which location is closer
    if (distanceToOrigin < distanceToDest) {
        // Origin is closer than destination, do nothing
    } else {
        // Destination is closer than origin, swap the values
        let tempId = originId;
        let tempName = originName;
        let tempLat = oLat;
        let tempLon = oLon;

        originId = destId; // Id for Roskilde St.
        originName = destName; // Name for Roskilde St.
        oLat = dLat; // Latitude for Roskilde St.
        oLon = dLon; // Longitude for Roskilde St.

        destId = tempId; // Id for Borup St.
        destName = tempName; // Name for Borup St.
        dLat = tempLat; // Latitude for Borup St.
        dLon = tempLon; // Longitude for Borup St.
    }

    // Save data to localStorage
    localStorage.setItem('originId', originId);
    localStorage.setItem('originName', originName);
    localStorage.setItem('oLat', oLat);
    localStorage.setItem('oLon', oLon);
    localStorage.setItem('destId', destId);
    localStorage.setItem('destName', destName);
    localStorage.setItem('dLat', dLat);
    localStorage.setItem('dLon', dLon);

    
    // Fetch trip data from the Rejseplanen API
fetch(`https://xmlopen.rejseplanen.dk/bin/rest.exe/trip?originId=${originId}&destId=${destId}&time=${time}&useBus=0`)
    .then(response => response.text())
    .then(data => {

        let parser = new DOMParser();
        let xmlDoc = parser.parseFromString(data, "text/xml");

        let trips = xmlDoc.getElementsByTagName('Trip');
        let tripData = [];

        let isDifferentDestination = false;

        // Extract data from the XML document
        for(let i = 0; i < trips.length; i++) {
            // Stop processing trips after the first three
            if (tripData.length >= 3) {
                break;
            }

            

            let trip = trips[i];

            // Check if the trip is cancelled
            let isCancelled = trip.getAttribute('cancelled');
            if (isCancelled === 'true') {
                continue; // Skip this iteration if the trip is cancelled
            }

            let leg = trip.getElementsByTagName('Leg')[0];
            let isBus = leg.getAttribute('name').includes('Togbus');

            let origin = trip.getElementsByTagName('Origin')[0];
            let destination = trip.getElementsByTagName('Destination')[0];
            let destinationName = destination.getAttribute('name');

            let originTime = origin.getAttribute('rtTime') || origin.getAttribute('time');
            let destinationTime = destination.getAttribute('rtTime') || destination.getAttribute('time');

            let originDelayText = origin.getAttribute('rtTime') ? getDelay(origin.getAttribute('rtTime'), origin.getAttribute('time')) : '';
            let destinationDelayText = destination.getAttribute('rtTime') ? getDelay(destination.getAttribute('rtTime'), destination.getAttribute('time')) : '';

            if (destinationName !== destName) {
                isDifferentDestination = true;
            }
            // Push the data to the tripData array
            tripData.push({
                origin: {
                    name: origin.getAttribute('name'),
                    time: originTime,
                    track: isBus ? `<i class="fa-regular fa-bus"></i> Togbus` : `Spor: ${origin.getAttribute('rtTrack')}` || `Spor: ${origin.getAttribute('track')}`,
                    delayed: origin.getAttribute('rtTime') !== null,
                    delayText: originDelayText
                },
                destination: {
                    name: destination.getAttribute('name'),
                    time: destinationTime,
                    track: isBus ? `<i class="fa-regular fa-bus"></i> Togbus` : `Spor: ${destination.getAttribute('rtTrack')}` || `Spor: ${destination.getAttribute('track')}`,
                    delayed: destination.getAttribute('rtTime') !== null,
                    delayText: destinationDelayText
                },
                isBus: isBus
            });
        }
        const warningDivSelector = window.innerWidth <= 768 ? '.warning-mobile' : '.warning-desktop';
        const warningDiv = document.querySelector(warningDivSelector);
        if (tripData.length < 3) {
                warningDiv.classList.remove('hidden');
                lastIndex = tripData.length;
            } else {
                warningDiv.classList.add('hidden');
                lastIndex = tripData.length;
            }

            // Format the trip data in divs
            container.innerHTML = '';
            tripData.forEach((trip, index) => {
                const tripClass = window.innerWidth <= 768 ? 'trip-mobile' : 'trip-desktop';
                const originDelayClass = trip.origin.delayed ? '' : 'transparent';
                const destinationDelayClass = trip.destination.delayed ? '' : 'transparent';

                const tripElement = `
                <div class="${tripClass} trip trip-${index + 1}">
                    <div class="title_time">
                        <h2 class="station origin-station">${trip.origin.name.slice(0, -1)}:</h2>
                        <span class="tooltip-container">
                            <span class="delay-indicator ${originDelayClass}">+${(typeof trip.origin.delayText === 'string' && trip.origin.delayText.match(/\d+/g) && trip.origin.delayText.match(/\d+/g).join('')) || '0'}</span>
                            <i class="fa-regular fa-clock ${originDelayClass}"></i>
                            <span class="tooltip-text">${trip.origin.delayText}</span>
                            <h2 id="title_time">${trip.origin.time}</h2>
                        </span>
                    </div>
                    <p class="track">${trip.origin.track}</p>
                    <div class="arrow_text">
                        <i class="fa-solid fa-angles-down"></i>
                        <p class="multipleStops hidden"><i class="fa-regular fa-circle-exclamation"></i> Ruten indeholder flere skift.</p>
                    </div>
                    <div class="title_time">
                        <h2 class="station destination-station">${trip.destination.name.slice(0, -1)}:</h2>
                        <span class="tooltip-container">
                            <span class="delay-indicator ${destinationDelayClass}">+${(typeof trip.destination.delayText === 'string' && trip.destination.delayText.match(/\d+/g) && trip.destination.delayText.match(/\d+/g).join('')) || '0'}</span>
                            <i class="fa-regular fa-clock ${destinationDelayClass}"></i>
                            <span class="tooltip-text">${trip.destination.delayText}</span>
                            <h2 id="title_time">${trip.destination.time}</h2>
                        </span>
                    </div>
                    <p class="track">${trip.destination.track}</p>
                </div>
                `;

                // Load animations
                removePlaceholder()
                deleteElements();
                animateTime();
                container.innerHTML += tripElement;
                charCount();

                // Allow refreshing again
                isRefreshing = false;
                swapRefreshing = false;
            });

            tripData.forEach((trip, index) => {
                let destinationName = trip.destination.name;
            
                if (destinationName !== destName) {
                    // Remove the 'hidden' class from .multipleStops of the specific trip
                    document.querySelector(`.trip-${index + 1} .multipleStops`).classList.remove('hidden');
                }
            });

            const script = document.createElement('script');
            script.src = './js/search.js';
            script.type = 'module';
            document.body.appendChild(script);
        })
        .catch(error => console.error('Error:', error));
        
    }, error => {
        // If the user denies access to their location, use the default values
        originId = borupId; // Id for Borup St.
        originName = borup; // Name for Borup St.
        destId = roskildeId; // Id for Roskilde St.
        destName = roskilde; // Name for Roskilde St.

        isRefreshing = false;
        swapRefreshing = false;
        container.innerHTML = '';
        hide();
        getData().then(() => {
            show();
        });

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

    // Load data from localStorage or use default values
    originId = localStorage.getItem('originId') || borupId; // Default Id for Borup St.
    originName = localStorage.getItem('originName') || borup; // Default name for Borup St.
    destId = localStorage.getItem('destId') || roskildeId; // Default Id for Roskilde St.
    destName = localStorage.getItem('destName') || roskilde; // Default name for Roskilde St.

    // Get current date and time
    let now = new Date();

    // Subtract specified minutes
    now.setMinutes(now.getMinutes() - subtractedMinutes);

    // Format time to HH:MM
    let time = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

    return new Promise((resolve, reject) => {
    // Fetch trip data from the Rejseplanen API
    fetch(`https://xmlopen.rejseplanen.dk/bin/rest.exe/trip?originId=${originId}&destId=${destId}&useBus=0&time=${time}`)
        .then(response => response.text())
        .then(data => {
            
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(data, "text/xml");

            // Extract the trips from the XML document
            const trips = Array.from(xmlDoc.getElementsByTagName('Trip'));

            // Process each trip
            let lastIndex = 0;
            let newContent = '';
            trips.forEach((trip, index) => {
                
                

                // Stop processing trips after the first three
                if (index > 2) {
                    return;
                }

                let leg = trip.getElementsByTagName('Leg')[0];
                let isBus = leg.getAttribute('name').includes('Togbus');

                const origin = trip.getElementsByTagName('Origin')[0];
                const destination = trip.getElementsByTagName('Destination')[0];

                const originTrackText = isBus ? `<i class="fa-regular fa-bus"></i> Togbus` : `Spor: ${origin.getAttribute('rtTrack')}` || `Spor: ${origin.getAttribute('track')}`;
                const destinationTrackText = isBus ? `<i class="fa-regular fa-bus"></i> Togbus` : `Spor: ${destination.getAttribute('rtTrack')}` || `Spor: ${destination.getAttribute('track')}`;

                // Check if the trip is cancelled
                let isCancelled = trip.getAttribute('cancelled');
                if (isCancelled === 'true') {
                    return; // Skip this iteration if the trip is cancelled
                } else {
                    // Increment the lastIndex if the trip is not cancelled
                    lastIndex++;
                }

                let oName = origin.getAttribute('name');
                if (oName.endsWith('.')) {
                    oName = oName.slice(0, -1);
                }

                let dName = destination.getAttribute('name');
                if (dName.endsWith('.')) {
                    dName = dName.slice(0, -1);
                }

                  
                const tripClass = window.innerWidth <= 768 ? 'trip-mobile' : 'trip-desktop';
                const originDelayClass = origin.getAttribute('rtTime') ? '' : 'transparent';
                const destinationDelayClass = destination.getAttribute('rtTime') ? '' : 'transparent';
                const originDelayText = origin.getAttribute('rtTime') ? getDelay(origin.getAttribute('rtTime'), origin.getAttribute('time')) : '';
                const destinationDelayText = destination.getAttribute('rtTime') ? getDelay(destination.getAttribute('rtTime'), destination.getAttribute('time')) : '';

                // Format the trip data in divs
                const tripElement = `
                <div id="trips" class="${tripClass} trip trip-${index + 1}">
                    <div class="title_time">
                        <h2 class="station origin-station">${oName}:</h2>
                        <span class="tooltip-container">
                            <span class="delay-indicator ${originDelayClass}">+${(typeof originDelayText === 'string' && originDelayText.match(/\d+/g) && originDelayText.match(/\d+/g).join('')) || '0'}</span>
                            <i class="fa-regular fa-clock ${originDelayClass}"></i>
                            <span class="tooltip-text">${originDelayText}</span>
                            <h2 id="title_time">${origin.getAttribute('rtTime') || origin.getAttribute('time')}</h2>
                        </span>
                    </div>
                    <p class="track">${originTrackText}</p>

                    <div class="arrow_text">
                        <i class="fa-solid fa-angles-down"></i>
                        <p class="multipleStops hidden"><i class="fa-regular fa-circle-exclamation"></i> Ruten indeholder flere skift.</p>
                    </div>

                    <div class="title_time">
                        <h2 class="station destination-station">${dName}:</h2>
                        <span class="tooltip-container">
                            <span class="delay-indicator ${destinationDelayClass}">+${(typeof destinationDelayText === 'string' && destinationDelayText.match(/\d+/g) && destinationDelayText.match(/\d+/g).join('')) || '0'}</span>
                            <i class="fa-regular fa-clock ${destinationDelayClass}"></i>
                            <span class="tooltip-text">${destinationDelayText}</span>
                            <h2 id="title_time">${destination.getAttribute('rtTime') || destination.getAttribute('time')}</h2>
                        </span>
                    </div>
                    <p class="track">${destinationTrackText}</p>
                </div>
                `;

                newContent += tripElement;
                charCount();

                

            container.innerHTML = newContent;
            
            });
            
            // Applies warning div if there are less than 3 trips
            const warningDivSelector = window.innerWidth <= 768 ? '.warning-mobile' : '.warning-desktop';
            const warningDiv = document.querySelector(warningDivSelector);
            if (lastIndex < 3) {
                warningDiv.classList.remove('hidden');
            } else {
                warningDiv.classList.add('hidden');
            }

            // Adds .multipleStops class to trips with multiple stops
            trips.forEach((trip, index) => {
                let destination = trip.getElementsByTagName('Destination')[0];
                let destinationName = destination.getAttribute('name');
                
                if (destinationName !== destName) {
            
                    // Get the element
                    let element = document.querySelector(`.trip-${index + 1} .multipleStops`);
            
                    // If the element exists, remove the 'hidden' class
                    if (element) {
                        element.classList.remove('hidden');
                    }
                }
            });

            resolve('done')

            // Get a reference to all script tags
            const scriptTags = document.querySelectorAll('script');

            // Remove any script tag whose src starts with 'search.js'
            scriptTags.forEach(scriptTag => {
                if (scriptTag.src.includes('search.js')) {
                    scriptTag.remove();
                }
            });

            setTimeout(() => {
                const script = document.createElement('script');
                script.src = './js/search.js?' + new Date().getTime(); // Add a cache-busting query parameter
                script.type = 'module';
                document.body.appendChild(script);
            }, 100);
            
        })
    })
    .catch(error => console.error('Error:', error));
    
}

// Finds refresh button and adds event listener to it
const refreshButton = document.querySelector('.refresh');

refreshButton.addEventListener('click', function() {
    if (isRefreshing) return;
    isRefreshing = true;
    this.setAttribute('disabled', 'disabled');
    let animation = refreshIcon();
    hide();
    getData().then(() => {
        show();
    });

    setTimeout(() => {
        this.removeAttribute('disabled');
        isRefreshing = false;
    }, 3000);
});

// Finds refresh button and adds event listener to it
const swapButton = document.querySelector('#swap');

swapButton.addEventListener('click', function() {
    if (swapRefreshing) return;
    swapRefreshing = true;
    this.setAttribute('disabled', 'disabled');
    swapAnim();
    hide();
    swap().then(() => {
        show();
    });

    setTimeout(() => {
        
        this.removeAttribute('disabled');
        swapRefreshing = false;
    }, 1500);
});



// Changes theme with delay
const themeButton = document.querySelector('.fa-train-subway');
let isChanging = false;

themeButton.addEventListener('click', function() {
    if (isChanging) return;
    isChanging = true;
    this.setAttribute('disabled', 'disabled');

    changeTheme();

    setTimeout(() => {
        
        this.removeAttribute('disabled');
        isChanging = false;
    }, 2000);
});


// Swaps origin and destination
function swapOriginAndDestination(originId, originName, destId, destName, oLat, oLon, dLat, dLon) {
    let tempId = originId;
    let tempName = originName;

    let tempLat = oLat;
    let tempLon = oLon;

    originId = destId;
    originName = destName;

    oLat = dLat;
    oLon = dLon;

    destId = tempId;
    destName = tempName;
    dLat = tempLat;
    dLon = tempLon;
    return {
        originId: originId,
        originName: originName,
        destId: destId,
        destName: destName,
        oLat: oLat,
        oLon: oLon,
        dLat: dLat,
        dLon: dLon
    };

    
}

// Swaps origin and destination and refreshes the trip data
function swap() {
    return new Promise((resolve, reject) => {
        try {
            let swappedValues = swapOriginAndDestination(originId, originName, destId, destName, oLat, oLon, dLat, dLon);
            originId = swappedValues.originId;
            originName = swappedValues.originName;
            destId = swappedValues.destId;
            destName = swappedValues.destName;
            oLat = swappedValues.oLat;
            oLon = swappedValues.oLon;
            dLat = swappedValues.dLat;
            dLon = swappedValues.dLon;

            localStorage.setItem('originId', swappedValues.originId);
            localStorage.setItem('originName', swappedValues.originName);
            localStorage.setItem('destId', swappedValues.destId);
            localStorage.setItem('destName', swappedValues.destName);
            localStorage.setItem('oLat', swappedValues.oLat);
            localStorage.setItem('oLon', swappedValues.oLon);
            localStorage.setItem('dLat', swappedValues.dLat);
            localStorage.setItem('dLon', swappedValues.dLon);

            getData().then(() => {
                resolve('done'); // Resolve the promise when getData() is done
            });
        } catch (error) {
            reject(error); // Reject the promise if there's an error
        }
    });
}


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

// Toggle darkmode
function changeTheme() {
    var element = document.body;
    element.classList.toggle("darkmode");
    localStorage.setItem('theme', element.classList.contains("darkmode") ? "darkmode" : "lightmode");
}

// Gets character count
function charCount() {
    if (window.innerWidth <= 768) {
        // Get all the h2 elements inside .trip
        let tripHeaders = document.querySelectorAll('.trip h2');
        
        let tooLong = false;
        let width = 60;
        // Loop through each h2 element
        tripHeaders.forEach(header => {
            // Check if the text length surpasses 13
            if (header.textContent.length > 13) {
                tooLong = true;
                width = 60;

                if (header.textContent.length > 15) {
                    width = 70;
                }
                
            } 
        });

        if (tooLong) {
            // If any h2 is too long, change the max-width of all .trip elements
            let style = document.createElement('style');
            style.innerHTML = `
                .trip {
                    width: ${width}vw !important;
                }
        `;
            document.head.appendChild(style);
        }
    }
}

// Loads your preferred theme
window.onload = function() {
    var savedTheme = localStorage.getItem('theme') || "lightmode";
    document.body.style.transition = "none";  // Temporarily disable transitions
    document.body.classList.add(savedTheme);
    window.getComputedStyle(document.body).getPropertyValue('background-color');  // Trigger a reflow
    document.body.style.transition = "";  // Re-enable transitions
}


// Toggles between desktop and mobile styles when the window is resized
window.addEventListener('resize', function() {
    const tripElements = document.querySelectorAll('.trip');
    
    tripElements.forEach((tripElement) => {
        const desktopWarning = document.querySelector('.warning-desktop');
        const mobileWarning = document.querySelector('.warning-mobile');
        if (window.innerWidth <= 768) {
            tripElement.classList.remove('trip-desktop');
            tripElement.classList.add('trip-mobile');

            if (lastIndex < 3) {
                mobileWarning.classList.remove('hidden');
                desktopWarning.classList.add('hidden');
            }
        } else {
            tripElement.classList.remove('trip-mobile');
            tripElement.classList.add('trip-desktop');

            if (lastIndex < 3) {
                desktopWarning.classList.remove('hidden');
                mobileWarning.classList.add('hidden');
            }
        }
    });
});

// Applies special CSS class if the website is added to the home screen on iOS
if (window.navigator.standalone) {
    document.body.classList.add('apple-mobile-web-app');
}

// Applies special CSS class if the website is opened in Safari on iOS
if(navigator.userAgent.indexOf('iPhone') > -1 )
{
    document
      .querySelector("[name=viewport]")
      .setAttribute("content","width=device-width, initial-scale=1, maximum-scale=1");
}

export { getData };