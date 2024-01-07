import { getData } from './handler.js';
var stations = [];

// Fetch the data from stations.json
fetch('../data/stations/stations.json')
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        stations = data;
        stations.sort((a, b) => a.stationName.localeCompare(b.stationName));
    })
    .catch(error => {
        console.error('There has been a problem with your fetch operation:', error);
    });

// Search function
function searchStation(query) {
    return stations.filter(station => station.stationName.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 5);
}

var oButton = document.querySelector('.origin-station');
var dButton = document.querySelector('.destination-station');


// Event listener for the search box
['.origin-station', '.destination-station'].forEach(selector => {
    document.querySelectorAll(selector).forEach(element => {
        element.addEventListener('click', () => {
            event.stopPropagation();
    
            // If a search box already exists, return early
            if (document.getElementById('searchBox')) {
                return;
            }
    
            // Create the search box
            var searchBox = document.createElement('input');
            searchBox.id = 'searchBox';
            searchBox.type = 'text';
            searchBox.placeholder = 'Søg efter en station...';
    
            // Create the results container
            var resultsContainer = document.createElement('div');
            resultsContainer.id = 'resultsContainer';
    
            // Create a new div to group the searchBox and resultsContainer
            var searchGroup = document.createElement('div');
            searchGroup.id = 'searchGroup';
    
            // Add the search box and results container to the searchGroup
            searchGroup.appendChild(searchBox);
            searchGroup.appendChild(resultsContainer);
    
            // Check which element was clicked and modify the output accordingly
            if (event.target.matches('.origin-station')) {
                let buttonRect = event.target.getBoundingClientRect();
    
                searchGroup.style.top = `${buttonRect.bottom + '5'}px`;
                searchGroup.style.left = `${buttonRect.left + window.scrollX}px`;
            } else if (event.target.matches('.destination-station')) {
                let buttonRect = event.target.getBoundingClientRect();
    
                searchGroup.style.top = `${buttonRect.bottom + '5'}px`;
                searchGroup.style.left = `${buttonRect.left + window.scrollX}px`;
            }
    
            // Add the searchGroup to the DOM
            document.body.appendChild(searchGroup);
    
            setTimeout(() => {
                searchGroup.classList.add('visible');
            }, 100);
    
            // // Add the search box and results container to the DOM
            // document.body.appendChild(searchBox);
            // document.body.appendChild(resultsContainer);
    
            // Add event listener for the search box input
            let originalTarget = event.target;
            searchBox.addEventListener('input', (event) => {
                var results = searchStation(event.target.value);
    
                // Clear the previous results
                resultsContainer.innerHTML = '';
                resultsContainer.style.width = `${searchBox.offsetWidth}px`;
                resultsContainer.style.top = `${searchBox.offsetHeight + searchBox.offsetTop}px`;
                // resultsContainer.style.left = `${searchBox.offsetLeft}px`;
    
                // Check if there are any results
                if (results.length === 0) {
                    // If there are no results, display a message
                    var messageElement = document.createElement('p');
                    //messageElement.textContent = 'No results found. Look at list of supported stations.';
                    messageElement.innerHTML = 'Ingen resultater. Tjek listen over understøttede stationer <a target=”_blank href="/stationer">her</a>.';
                    messageElement.id = 'no_results';
                    resultsContainer.appendChild(messageElement);
                    resultsContainer.style.display = 'block';
    
                    /*stationData.originId = station.data.stationId;
                    stationData.originName = station.stationName;*/
                } else {
                    // If there are results, display them
                    resultsContainer.style.display = 'block';
                }
                
                // Display the results
                results.forEach(station => {
                    var resultElement = document.createElement('p');
                    resultElement.id = 'result';
                    resultElement.textContent = station.stationName;
                    resultElement.addEventListener('click', () => {
                        searchBox.value = station.stationName;
                        // Log the station's id and coordinates
    
                        if (originalTarget.matches('.origin-station')) {
    
                            if (localStorage.getItem('destId') === station.data.stationId) {
                                console.error('Origin and destination stations cannot be the same');
                                searchGroup.remove();
                                return;
                            }
    
                            // Overwrite local storage
                            localStorage.setItem('originId', station.data.stationId);
                            localStorage.setItem('originName', station.stationName);
                            localStorage.setItem('oLat', station.data.coords.lat);
                            localStorage.setItem('oLon', station.data.coords.lon);
                            
    
                            refresh();
                            getData();
    
                        } else if (originalTarget.matches('.destination-station')) {
    
                            if (localStorage.getItem('originId') === station.data.stationId) {
                                console.error('Origin and destination stations cannot be the same');
                                searchGroup.remove();
                                return;
                            }
    
                            // Overwrite local storage
                            localStorage.setItem('destId', station.data.stationId);
                            localStorage.setItem('destName', station.stationName);
                            localStorage.setItem('dLat', station.data.coords.lat);
                            localStorage.setItem('dLon', station.data.coords.lon);
                            
                            refresh();
                            getData();
                        }
    
                        
                        searchGroup.remove();
    
                        
                    });
                    resultsContainer.appendChild(resultElement);
                });
            });
        });
    })
});

// Add event listener for clicks on the document
document.addEventListener('click', (event) => {
    var searchBox = document.getElementById('searchBox');
    var resultsContainer = document.getElementById('resultsContainer');
    var searchGroup = document.getElementById('searchGroup');

    // If either the search box or results container don't exist, return early
    if (!searchBox || !resultsContainer) {
        return;
    }

    // Check if the click was outside the search box or the results container
    if (!searchBox.contains(event.target) && !resultsContainer.contains(event.target)) {

        searchGroup.classList.remove('visible');
        setTimeout(() => {
            searchGroup.remove();
        }, 100);
    }
});