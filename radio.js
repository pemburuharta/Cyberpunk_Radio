const API_USER_AGENT = 'USRadioBrowser/1.0';
let BASE_URL = ''; // Will be set dynamically
const MIN_STATIONS_PER_GENRE = 5;
const APP_VERSION = '1.0.0';

// Genre name normalization map
const genreNormalization = {
    'rock': ['rock', 'rocks', 'classic rock', 'classic-rock'],
    'pop': ['pop', 'popular', 'top 40', 'top40'],
    'jazz': ['jazz', 'smooth jazz'],
    'classical': ['classical', 'classic', 'orchestra'],
    'country': ['country', 'country music'],
    'blues': ['blues', 'rhythm and blues', 'rhythm & blues'],
    'hip hop': ['hip hop', 'hip-hop', 'rap'],
    'electronic': ['electronic', 'electronica', 'electro'],
    'folk': ['folk', 'folk music'],
    'metal': ['metal', 'heavy metal'],
    'indie': ['indie', 'independent'],
    'soul': ['soul', 'r&b', 'rnb'],
    'alternative': ['alternative', 'alt'],
    'latin': ['latin', 'latino', 'latina'],
    'reggae': ['reggae', 'ska']
};

// DOM elements
const genresContainer = document.getElementById('genres');
const stationsContainer = document.getElementById('stations');
const audioPlayer = document.getElementById('audio-player');
const playerBar = document.getElementById('player-bar');
const nowPlayingTitle = document.getElementById('now-playing-title');
const playPauseBtn = document.getElementById('play-pause-btn');
const playIcon = document.getElementById('play-icon');
const pauseIcon = document.getElementById('pause-icon');
const closePlayer = document.getElementById('close-player');
const backToTop = document.getElementById('back-to-top');
const searchInput = document.getElementById('station-search');
const noResults = document.getElementById('no-results');
const appSubtitle = document.getElementById('app-subtitle');
const genresLoading = document.getElementById('genres-loading');
const stationsLoading = document.getElementById('stations-loading');
const networkStatus = document.getElementById('network-status');

// Global state
let currentStations = [];
let isPlaying = false;
let currentStation = null;

// Set theme based on system preference
function setTheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
    }
}

// Theme listener
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', setTheme);

/**
 * Ask a specified server for a list of all other servers.
 */
async function getRadiobrowserBaseUrls() {
    try {
        const response = await fetch('https://all.api.radio-browser.info/json/servers', {
            headers: {
                'User-Agent': API_USER_AGENT
            }
        });
        
        if (!response.ok) throw new Error('Failed to fetch server list');
        
        const servers = await response.json();
        // Convert to HTTPS URLs
        return servers.map(server => `https://${server.name}`);
    } catch (error) {
        console.error('Error fetching radio browser servers:', error);
        // Fallback to a known server if the lookup fails
        return ['https://de1.api.radio-browser.info'];
    }
}

/**
 * Get a random available radio-browser server.
 */
async function getRandomRadioBrowserBaseUrl() {
    const hosts = await getRadiobrowserBaseUrls();
    return hosts[Math.floor(Math.random() * hosts.length)];
}

/**
 * Initialize the API by selecting a random server
 */
async function initializeApi() {
    try {
        // Get a random server URL
        BASE_URL = await getRandomRadioBrowserBaseUrl();
        console.log('Using radio browser API server:', BASE_URL);
        return true;
    } catch (error) {
        console.error('Failed to initialize API:', error);
        showNetworkError();
        return false;
    }
}

// Navigation functions
function navigateToLanding() {
    document.body.className = 'landing-view';
    appSubtitle.textContent = 'Cyberpunk Internet Radio';
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function navigateToGenres() {
    document.body.className = 'genre-view';
    appSubtitle.textContent = 'Discover radio stations';
    
    // Animation classes
    document.getElementById('genres-view').classList.add('slide-in');
    
    setTimeout(() => {
        document.getElementById('genres-view').classList.remove('slide-in');
    }, 300);
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function navigateToStations(genre) {
    document.body.className = 'station-view';
    document.getElementById('stations-view').classList.add('slide-in');
    
    setTimeout(() => {
        document.getElementById('stations-view').classList.remove('slide-in');
    }, 300);
    
    // Update UI
    appSubtitle.textContent = `${genre.charAt(0).toUpperCase() + genre.slice(1)} stations`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function navigateToAbout() {
    document.body.className = 'about-view';
    appSubtitle.textContent = 'About & Help';
    
    document.getElementById('about-view').classList.add('slide-in');
    
    setTimeout(() => {
        document.getElementById('about-view').classList.remove('slide-in');
    }, 300);
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Loading state functions
function showLoading(type) {
    if (type === 'genres') {
        genresLoading.style.display = 'block';
        genresContainer.style.display = 'none';
    } else if (type === 'stations') {
        stationsLoading.style.display = 'block';
        stationsContainer.style.display = 'none';
        noResults.style.display = 'none';
    }
}

function hideLoading(type) {
    if (type === 'genres') {
        genresLoading.style.display = 'none';
        genresContainer.style.display = 'grid';
    } else if (type === 'stations') {
        stationsLoading.style.display = 'none';
        stationsContainer.style.display = 'block';
    }
}

// Load genres
async function loadGenres() {
    showLoading('genres');
    genresContainer.innerHTML = '';

    try {
        // Make sure we have a BASE_URL
        if (!BASE_URL) {
            await initializeApi();
        }
        
        const response = await fetch(`${BASE_URL}/json/stations/bycountrycodeexact/US`, {
            headers: {
                'User-Agent': API_USER_AGENT
            }
        });
        
        if (!response.ok) {
            // If this server fails, try to get another one
            console.log('Server request failed, trying another server...');
            await initializeApi();
            return loadGenres(); // Retry with new server
        }
        
        const stations = await response.json();
        
        // Create a map for genre counts
        const genreCounts = new Map();
        
        stations.forEach(station => {
            if (station.tags && station.lastcheckok === 1) {
                const tags = station.tags.toLowerCase().split(',').map(tag => tag.trim());
                
                tags.forEach(tag => {
                    for (const [normalizedGenre, variants] of Object.entries(genreNormalization)) {
                        if (variants.some(variant => tag.includes(variant))) {
                            const count = genreCounts.get(normalizedGenre) || 0;
                            genreCounts.set(normalizedGenre, count + 1);
                            break;
                        }
                    }
                });
            }
        });

        // Filter genres with minimum station count and sort by popularity
        const popularGenres = Array.from(genreCounts.entries())
            .filter(([_, count]) => count >= MIN_STATIONS_PER_GENRE)
            .sort((a, b) => b[1] - a[1]);

        // Create genre cards
        popularGenres.forEach(([genre, count]) => {
            const card = document.createElement('div');
            card.className = 'genre-card';
            
            const content = document.createElement('div');
            content.className = 'genre-content';
            
            const name = document.createElement('div');
            name.className = 'genre-name';
            name.textContent = genre.charAt(0).toUpperCase() + genre.slice(1);
            
            const countEl = document.createElement('div');
            countEl.className = 'genre-count';
            countEl.textContent = `${count} stations`;
            
            content.appendChild(name);
            content.appendChild(countEl);
            card.appendChild(content);
            
            // Add ripple effect and click handler
            card.addEventListener('click', (e) => {
                createRipple(e, card);
                loadStations(genre);
                navigateToStations(genre);
            }, { passive: true });
            
            genresContainer.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading genres:', error);
        genresContainer.innerHTML = '<div class="error-container">Error loading genres. Please try again later.</div>';
        showNetworkError();
    } finally {
        hideLoading('genres');
    }
}

// Load stations for a selected genre
async function loadStations(genre) {
    showLoading('stations');
    stationsContainer.innerHTML = '';
    
    // Reset search
    searchInput.value = '';
    
    try {
        // Make sure we have a BASE_URL
        if (!BASE_URL) {
            await initializeApi();
        }
        
        const response = await fetch(`${BASE_URL}/json/stations/bycountrycodeexact/US`, {
            headers: {
                'User-Agent': API_USER_AGENT
            }
        });
        
        if (!response.ok) {
            // If this server fails, try to get another one
            console.log('Server request failed, trying another server...');
            await initializeApi();
            return loadStations(genre); // Retry with new server
        }
        
        const stations = await response.json();
        
        // Filter stations by genre
        const variants = genreNormalization[genre.toLowerCase()] || [genre.toLowerCase()];
        const filteredStations = stations.filter(station => 
            station.tags && 
            station.lastcheckok === 1 && 
            variants.some(variant => 
                station.tags.toLowerCase().split(',').some(tag => 
                    tag.trim().includes(variant)
                )
            )
        );

        // Store globally for search
        currentStations = filteredStations;

        if (filteredStations.length === 0) {
            stationsContainer.innerHTML = '<div class="error-container">No active stations found for this genre.</div>';
            return;
        }

        // Display stations
        displayStations(filteredStations);
        
        // Toggle back to top button
        toggleBackToTopButton();
        
        // Listen for scroll events
        window.addEventListener('scroll', toggleBackToTopButton, { passive: true });
    } catch (error) {
        console.error('Error loading stations:', error);
        stationsContainer.innerHTML = '<div class="error-container">Error loading stations. Please try again later.</div>';
        showNetworkError();
    } finally {
        hideLoading('stations');
    }
}

// Display stations list
function displayStations(stations) {
    stationsContainer.innerHTML = '';
    
    if (stations.length === 0) {
        noResults.style.display = 'block';
        return;
    } else {
        noResults.style.display = 'none';
    }
    
    stations.forEach(station => {
        const card = document.createElement('div');
        card.className = 'station-card';
        
        const infoDiv = document.createElement('div');
        infoDiv.className = 'station-info';
        
        const name = document.createElement('div');
        name.className = 'station-name';
        name.textContent = station.name;
        
        const tags = document.createElement('div');
        tags.className = 'station-tags';
        tags.textContent = station.tags;
        
        const btn = document.createElement('button');
        btn.className = 'play-btn';
        
        const playIcon = document.createElement('div');
        playIcon.className = 'play-icon';
        btn.appendChild(playIcon);
        
        // Add play station handler
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            createRipple(e, btn);
            playStation(station);
        }, { passive: true });
        
        // Make the entire card clickable
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.play-btn')) {
                createRipple(e, card);
                playStation(station);
            }
        }, { passive: true });
        
        infoDiv.appendChild(name);
        infoDiv.appendChild(tags);
        card.appendChild(infoDiv);
        card.appendChild(btn);
        stationsContainer.appendChild(card);
    });
}

// Play selected station
function playStation(station) {
    currentStation = station;
    const url = station.url_resolved;
    
    // Update UI first for perceived performance
    playerBar.style.display = 'flex';
    nowPlayingTitle.textContent = station.name;
    
    // Update now playing UI with equalizer
    let equalizerHtml = '';
    for (let i = 0; i < 5; i++) {
        equalizerHtml += '<div class="equalizer-bar"></div>';
    }
    
    const equalizer = document.createElement('div');
    equalizer.className = 'equalizer';
    equalizer.innerHTML = equalizerHtml;
    
    nowPlayingTitle.parentNode.appendChild(equalizer);
    
    // Setup audio
    audioPlayer.src = url;
    audioPlayer.load();
    
    // Play and handle errors
    audioPlayer.play()
        .then(() => {
            isPlaying = true;
            updatePlayPauseButton();
            
            // Record station click
            if (station.stationuuid) {
                // Make sure we have a BASE_URL before recording click
                if (BASE_URL) {
                    fetch(`${BASE_URL}/json/url/${station.stationuuid}`, {
                        method: 'GET',
                        headers: {
                            'User-Agent': API_USER_AGENT
                        }
                    }).catch(err => console.log('Non-critical error recording station click:', err));
                }
            }
        })
        .catch(error => {
            console.error('Error playing audio:', error);
            showToast('Error playing this station. Please try another one.');
            playerBar.style.display = 'none';
        });
}

// Toggle play/pause
function togglePlayPause() {
    if (!currentStation) return;
    
    if (isPlaying) {
        audioPlayer.pause();
        isPlaying = false;
    } else {
        audioPlayer.play()
            .then(() => {
                isPlaying = true;
            })
            .catch(error => {
                console.error('Error resuming playback:', error);
                showToast('Error playing this station. Please try another one.');
            });
    }
    
    updatePlayPauseButton();
}

// Update play/pause button state
function updatePlayPauseButton() {
    if (isPlaying) {
        playIcon.style.display = 'none';
        pauseIcon.style.display = 'block';
    } else {
        playIcon.style.display = 'block';
        pauseIcon.style.display = 'none';
    }
}

function stopPlayback() {
    // Set a flag to indicate intentional stop
    audioPlayer.dataset.intentionalStop = 'true';
    
    // Stop playback
    audioPlayer.pause();
    audioPlayer.src = '';
    isPlaying = false;
    currentStation = null;
    playerBar.style.display = 'none';
    
    // Remove equalizer if it exists
    const equalizer = document.querySelector('.equalizer');
    if (equalizer) {
        equalizer.remove();
    }
}

// Show network error message
function showNetworkError() {
    networkStatus.classList.add('visible');
    
    setTimeout(() => {
        networkStatus.classList.remove('visible');
    }, 3000);
}

// Show toast message
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'network-status';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('visible');
    }, 10);
    
    setTimeout(() => {
        toast.classList.remove('visible');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// Toggle back to top button
function toggleBackToTopButton() {
    if (window.scrollY > 300) {
        backToTop.classList.add('visible');
    } else {
        backToTop.classList.remove('visible');
    }
}

// Material design ripple effect
function createRipple(event, element) {
    const rect = element.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    
    element.appendChild(ripple);
    
    setTimeout(() => {
        ripple.remove();
    }, 600);
}

// Filter stations based on search
function filterStations() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    if (searchTerm === '') {
        displayStations(currentStations);
        return;
    }
    
    const filtered = currentStations.filter(station => 
        station.name.toLowerCase().includes(searchTerm) ||
        station.tags.toLowerCase().includes(searchTerm)
    );
    
    displayStations(filtered);
}

// Tab functionality for about page
function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');
            
            // Update active state for buttons
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Show the corresponding tab content
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === `${tabName}-tab`) {
                    content.classList.add('active');
                }
            });
        });
    });
}

// Network listeners
window.addEventListener('online', () => {
    networkStatus.textContent = 'You are back online!';
    networkStatus.style.background = 'var(--secondary-color)';
    networkStatus.classList.add('visible');
    
    setTimeout(() => {
        networkStatus.classList.remove('visible');
    }, 3000);
    
    // Reload content if needed
    if (document.body.classList.contains('genre-view') && genresContainer.children.length === 0) {
        loadGenres();
    }
});

window.addEventListener('offline', () => {
    networkStatus.textContent = 'You are offline. Please check your connection.';
    networkStatus.style.background = 'var(--error)';
    networkStatus.classList.add('visible');
});

// Audio player event listeners
audioPlayer.addEventListener('ended', () => {
    isPlaying = false;
    updatePlayPauseButton();
});

audioPlayer.addEventListener('error', () => {
    // Only show error message if it wasn't an intentional stop
    if (audioPlayer.dataset.intentionalStop !== 'true') {
        showToast('Error playing this station. Please try another one.');
    }
    
    // Reset the intentional stop flag
    audioPlayer.dataset.intentionalStop = 'false';
    
    isPlaying = false;
    updatePlayPauseButton();
});

// Cordova lifecycle events
document.addEventListener('pause', () => {
    // Store playback state
    localStorage.setItem('wasPlaying', isPlaying);
}, false);

document.addEventListener('resume', () => {
    // Restore playback state
    const wasPlaying = localStorage.getItem('wasPlaying') === 'true';
    
    if (wasPlaying && audioPlayer.paused && currentStation) {
        audioPlayer.play().catch(err => console.log('Could not resume playback:', err));
    }
}, false);

// Event listeners
document.addEventListener('DOMContentLoaded', async () => {
    // Set theme
    setTheme();
    
    // Set up navigation button listeners
    document.getElementById('back-to-landing').addEventListener('click', navigateToLanding);
    document.getElementById('back-to-genres').addEventListener('click', navigateToGenres);
    
    // Set up landing page buttons
    document.getElementById('start-listening-btn').addEventListener('click', () => {
        navigateToGenres();
        if (genresContainer.children.length === 0) {
            loadGenres();
        }
    });
    document.getElementById('about-help-btn').addEventListener('click', navigateToAbout);
    
    // Set up about button in header
    document.getElementById('about-button').addEventListener('click', navigateToAbout);
    
    // Set up player controls
    playPauseBtn.addEventListener('click', togglePlayPause);
    closePlayer.addEventListener('click', stopPlayback);
    backToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    
    // Search functionality
    searchInput.addEventListener('input', filterStations);
    
    // Setup tabs for about page
    setupTabs();
    
    // Initialize API but don't load genres yet (wait for user to press "Start Listening")
    if (!window.cordova) {
        await initializeApi();
    }
});

// Cordova initialization
document.addEventListener('deviceready', async () => {
    document.body.classList.add('cordova');
    
    // Prevent screen from going to sleep during playback
    if (window.plugins && window.plugins.insomnia) {
        window.plugins.insomnia.keepAwake();
    }
    
    // Handle hardware back button
    document.addEventListener('backbutton', (e) => {
        if (document.body.classList.contains('about-view')) {
            e.preventDefault();
            navigateToLanding();
        } else if (document.body.classList.contains('station-view')) {
            e.preventDefault();
            navigateToGenres();
        } else if (document.body.classList.contains('genre-view')) {
            e.preventDefault();
            navigateToLanding();
        } else {
            e.preventDefault();
            
            // Confirm exit with Material Design look
            const confirmExit = confirm('Exit application?');
            if (confirmExit) {
                navigator.app.exitApp();
            }
        }
    }, false);
    
    // Initialize API but don't load genres yet (wait for user to press "Start Listening")
    await initializeApi();
}, false);

// Add API retry capability on network reconnection
window.addEventListener('online', async () => {
    networkStatus.textContent = 'You are back online!';
    networkStatus.style.background = 'var(--secondary-color)';
    networkStatus.classList.add('visible');
    
    setTimeout(() => {
        networkStatus.classList.remove('visible');
    }, 3000);
    
    // Reinitialize the API if needed
    if (!BASE_URL) {
        await initializeApi();
    }
    
    // Reload content if needed
    if (document.body.classList.contains('genre-view') && genresContainer.children.length === 0) {
        loadGenres();
    }
});

// Dynamically update version info
document.addEventListener('DOMContentLoaded', () => {
    const versionInfoElement = document.querySelector('.version-info');
    if (versionInfoElement) {
        versionInfoElement.textContent = `US Radio v${APP_VERSION}`;
    }
});

// Error handling for API calls
function handleApiError(error, retryFunction) {
    console.error('API Error:', error);
    
    // If the error indicates a server problem, try to get a new server
    if (error.status >= 500 || error.message === 'Failed to fetch') {
        return initializeApi().then(() => {
            if (retryFunction) return retryFunction();
        });
    }
    
    showNetworkError();
    return Promise.reject(error);
}