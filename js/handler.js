const roskildeSt = { lat: 55.6401, lon: 12.0804 }; // Replace with actual coordinates
const borup = { lat: 55.4959, lon: 11.9778 }; // Replace with actual coordinates

const container = document.getElementById('tripsContainer');

// Get current date and time
let now = new Date();

// Subtract 15 minutes
now.setMinutes(now.getMinutes() - 10);

// Format time to HH:MM
let time = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

console.log(time);


// Get the user's current location
let originId, destId;
navigator.geolocation.getCurrentPosition(position => {
    const userLocation = { lat: position.coords.latitude, lon: position.coords.longitude };

    // Calculate the distance to Roskilde St. and Borup
    const distanceToRoskildeSt = getDistance(userLocation, roskildeSt);
    const distanceToBorup = getDistance(userLocation, borup);

    // Determine the originId and destId based on which location is closer
    
    if (distanceToRoskildeSt > distanceToBorup) {
         originId = '8600614'; // Replace with actual originId for Roskilde St.
         destId = '6555'; // Replace with actual destId for Borup
    } else {
         originId = '6555'; // Replace with actual originId for Borup
         destId = '8600614'; // Replace with actual destId for Roskilde St.
    }

    

    fetch(`https://xmlopen.rejseplanen.dk/bin/rest.exe/trip?originId=${originId}&destId=${destId}&useBus=0&time=${time}`)
    .then(response => response.text())
    .then(data => {
        let parser = new DOMParser();
        let xmlDoc = parser.parseFromString(data, "text/xml");

        let trips = xmlDoc.getElementsByTagName('Trip');
        let tripData = [];

        for(let i = 0; i < trips.length; i++) {
            let trip = trips[i];
            let origin = trip.getElementsByTagName('Origin')[0];
            let destination = trip.getElementsByTagName('Destination')[0];

            tripData.push({
                origin: {
                    name: origin.getAttribute('name'),
                    time: origin.getAttribute('rtTime') || origin.getAttribute('time'),
                    track: origin.getAttribute('track')
                },
                destination: {
                    name: destination.getAttribute('name'),
                    time: destination.getAttribute('rtTime') || destination.getAttribute('time'),
                    track: destination.getAttribute('track')
                }
            });
        }
    
    container.innerHTML = '';
    tripData.forEach((trip, index) => {
        const tripClass = window.innerWidth <= 768 ? 'trip-mobile' : 'trip-desktop';
        const tripElement = `
            <div class="${tripClass} trip ${index + 1}">
                <div class="title_time">
                    <h2>${trip.origin.name.slice(0, -1)}:</h2>
                    <h2 id="title_time">${trip.origin.time}</h2>
                </div>
                <p class="track">Spor: ${trip.origin.track}</p>
                <i class="fa-solid fa-angles-down"></i>
                <div class="title_time">
                    <h2>${trip.destination.name.slice(0, -1)}:</h2>
                    <h2 id="title_time">${trip.destination.time}</h2>
                </div>
                <p class="track">Spor: ${trip.destination.track}</p>
            </div>
        `;

        //newContent += tripElement;
        removePlaceholder()
        deleteElements();
        animateTime();
        container.innerHTML += tripElement;
    });
    //container.innerHTML = newContent;

    
})

.catch(error => console.error('Error:', error));
});


function getData() {
    // Clear the existing data
    //container.innerHTML = '';
    //refresh();
    // Fetch the new data
    fetch(`https://xmlopen.rejseplanen.dk/bin/rest.exe/trip?originId=${originId}&destId=${destId}&useBus=0&time=${time}`)
        .then(response => response.text())
        .then(data => {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(data, "text/xml");

            // Extract the trips from the XML document
            const trips = Array.from(xmlDoc.getElementsByTagName('Trip'));

            // Process each trip
            let newContent = '';
            trips.forEach((trip, index) => {
                const origin = trip.getElementsByTagName('Origin')[0];
                const destination = trip.getElementsByTagName('Destination')[0];

                const tripClass = window.innerWidth <= 768 ? 'trip-mobile' : 'trip-desktop';
                const tripElement = `
                <div class="${tripClass} trip ${index + 1}">
                    <div class="title_time">
                        <h2>${origin.getAttribute('name').slice(0, -1)}:</h2>
                        <h2 id="title_time">${origin.getAttribute('time')}</h2>
                    </div>
                    <p class="track">Spor: ${origin.getAttribute('track')}</p>
                    <i class="fa-solid fa-angles-down"></i>
                    <div class="title_time">
                        <h2>${destination.getAttribute('name').slice(0, -1)}:</h2>
                        <h2 id="title_time">${destination.getAttribute('time')}</h2>
                    </div>
                    <p class="track">Spor: ${destination.getAttribute('track')}</p>
                </div>
    `;

    newContent += tripElement;
});

container.innerHTML = newContent;
        })
        .catch(error => console.error('Error:', error));
}

const refreshButton = document.querySelector('.refresh');

let isRefreshing = false;

refreshButton.addEventListener('click', function() {
    if (isRefreshing) return;
    refresh();
    isRefreshing = true;
    this.setAttribute('disabled', 'disabled');

    
    setTimeout(getData, 0);

    setTimeout(() => {
        
        this.removeAttribute('disabled');
        isRefreshing = false;
    }, 5000);
});

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

function deleteElements() {
    const elements = document.querySelectorAll('.delete');

    elements.forEach(element => {
        element.remove();
    });
}

if (window.navigator.standalone) {
    document.body.classList.add('apple-mobile-web-app');
}

/*function refreshData() {
    refresh();
    setTimeout(getData, 100);
}*/