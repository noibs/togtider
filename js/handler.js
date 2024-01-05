const roskildeSt = { lat: 55.6401, lon: 12.0804 }; // Roskilde St. coordinates
const borupSt = { lat: 55.4959, lon: 11.9778 }; // Borup St. coordinates

const roskildeId = '6555'; // Id for Roskilde St.
const borupId = '8600614'; // Id for Borup St.

const roskilde = 'Roskilde St.'; // Name for Roskilde St.
const borup = 'Borup St.'; // Name for Borup St.

const subtractedMinutes = 0; // Subtract 15 minutes from current time

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

// Get the user's current location
let originId, destId, originName, destName;
navigator.geolocation.getCurrentPosition(position => {
    const userLocation = { lat: position.coords.latitude, lon: position.coords.longitude };

    // Calculate the distance to Roskilde St. and Borup St.
    const distanceToRoskildeSt = getDistance(userLocation, roskildeSt);
    const distanceToBorup = getDistance(userLocation, borupSt);

    // Determine the originId and destId based on which location is closer
    if (distanceToRoskildeSt > distanceToBorup) {
         originId = borupId; // Id for Borup St.
         originName = borup; // Name for Borup St.
         destId = roskildeId; // Id for Roskilde St.
         destName = roskilde; // Name for Roskilde St.
    } else {
        originId = roskildeId; // Id for Roskilde St.
        originName = roskilde; // Name for Roskilde St.
        destId = borupId; // Id for Borup St.
        destName = borup; // Name for Borup St.
    }

    
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
                console.log('Different destination');
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
        console.log(warningDivSelector);
        const warningDiv = document.querySelector(warningDivSelector);
        if (tripData.length < 3) {
                warningDiv.classList.remove('hidden');
                console.log(tripData.length);
                lastIndex = tripData.length;
            } else {
                warningDiv.classList.add('hidden');
                console.log(tripData.length);
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
                        <h2 class="station">${trip.origin.name.slice(0, -1)}:</h2>
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
                        <h2 class="station">${trip.destination.name.slice(0, -1)}:</h2>
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

                // Allow refreshing again
                isRefreshing = false;
                swapRefreshing = false;
            });

            tripData.forEach((trip, index) => {
                let destinationName = trip.destination.name;
            
                if (destinationName !== destName) {
                    // Remove the 'hidden' class from .multipleStops of the specific trip
                    document.querySelector(`.trip-${index + 1} .multipleStops`).classList.remove('hidden');
                    console.log('Removed hidden class');
                }
            });
        })
        .catch(error => console.error('Error:', error));
        
    }, error => {
        originId = borupId; // Id for Borup St.
        originName = borup; // Name for Borup St.
        destId = roskildeId; // Id for Roskilde St.
        destName = roskilde; // Name for Roskilde St.

        isRefreshing = false;
        swapRefreshing = false;
        container.innerHTML = '';
        refresh();
        getData();

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

    // Subtract specified minutes
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
            let lastIndex = 0;
            let newContent = '';
            trips.forEach((trip, index) => {
                
                

                // Stop processing trips after the first three
                if (index > 3) {
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

                  
                const tripClass = window.innerWidth <= 768 ? 'trip-mobile' : 'trip-desktop';
                const originDelayClass = origin.getAttribute('rtTime') ? '' : 'transparent';
                const destinationDelayClass = destination.getAttribute('rtTime') ? '' : 'transparent';
                const originDelayText = origin.getAttribute('rtTime') ? getDelay(origin.getAttribute('rtTime'), origin.getAttribute('time')) : '';
                const destinationDelayText = destination.getAttribute('rtTime') ? getDelay(destination.getAttribute('rtTime'), destination.getAttribute('time')) : '';

                // Format the trip data in divs
                const tripElement = `
                <div id="trips" class="${tripClass} trip trip-${index + 1}">
                    <div class="title_time">
                        <h2 class="station">${origin.getAttribute('name').slice(0, -1)}:</h2>
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
                        <h2 class="station">${destination.getAttribute('name').slice(0, -1)}:</h2>
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


                

            container.innerHTML = newContent;
            
            });
            
            // Applies warning div if there are less than 3 trips
            const warningDivSelector = window.innerWidth <= 768 ? '.warning-mobile' : '.warning-desktop';
            console.log(warningDivSelector);
            const warningDiv = document.querySelector(warningDivSelector);
            if (lastIndex < 3) {
                warningDiv.classList.remove('hidden');
                console.log(lastIndex);
            } else {
                warningDiv.classList.add('hidden');
                console.log(lastIndex);
            }

            trips.forEach((trip, index) => {
                let destination = trip.getElementsByTagName('Destination')[0];
                let destinationName = destination.getAttribute('name');
            
                if (destinationName !== destName) {
                    // Remove the 'hidden' class from .multipleStops of the specific trip
                    document.querySelector(`.trip-${index + 1} .multipleStops`).classList.remove('hidden');
                    console.log('Removed hidden class: ' + destinationName);
                }
            });
            
        })
        .catch(error => console.error('Error:', error));
    
}

// Finds refresh button and adds event listener to it
const refreshButton = document.querySelector('.refresh');

refreshButton.addEventListener('click', function() {
    if (isRefreshing) return;
    isRefreshing = true;
    this.setAttribute('disabled', 'disabled');
    refreshIcon();
    refresh();
    setTimeout(getData, 0);

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
    refresh();
    swapAnim();
    swap();

    setTimeout(() => {
        
        this.removeAttribute('disabled');
        swapRefreshing = false;
    }, 3000);
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

function swapOriginAndDestination(originId, originName, destId, destName) {
    let tempId = originId;
    let tempName = originName;

    originId = destId;
    originName = destName;

    destId = tempId;
    destName = tempName;
    return {
        originId: originId,
        originName: originName,
        destId: destId,
        destName: destName
    };

    
}

function swap() {
    let swappedValues = swapOriginAndDestination(originId, originName, destId, destName);
    originId = swappedValues.originId;
    originName = swappedValues.originName;
    destId = swappedValues.destId;
    destName = swappedValues.destName;

    getData(originId, originName, destId, destName);
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