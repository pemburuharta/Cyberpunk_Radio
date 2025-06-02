# 🎧 Cyberpunk Radio - US Internet Radio Streaming App

A futuristic, cyberpunk-themed internet radio streaming application that lets you discover and listen to thousands of radio stations from across the United States.
![cpunk_radio_genres](https://github.com/user-attachments/assets/521717e2-4d2b-441c-a8fa-ee53fce5964d)
![cpunk_radio_playing](https://github.com/user-attachments/assets/1e986918-544d-4f4d-bc6e-8365e88257d9)

## ✨ Features

- 🎵 **Stream thousands of US radio stations** - Access a vast collection of radio stations across various genres
- 🎨 **Cyberpunk UI** - Immersive neon-lit interface with glitch effects and animations
- 📱 **Responsive Design** - Works seamlessly on desktop, tablet, and mobile devices
- 🔍 **Smart Search** - Quickly find stations by name or tags
- 🎭 **Genre Browser** - Explore stations organized by musical genres
- 🌐 **Offline Detection** - Graceful handling of network connectivity issues
- 🎮 **Smooth Animations** - Material Design-inspired interactions with cyberpunk flair

## 🛠️ Technology Stack

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **API**: [Radio Browser API](https://www.radio-browser.info/)
- **Fonts**: Google Fonts (Rajdhani, Share Tech Mono)
- **Icons**: Font Awesome 5

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/cyberpunk-radio.git
   cd cyberpunk-radio
   ```

2. **Open in a web browser**
   
   Simply open `index.html` in your web browser, or use a local server:
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx serve
   ```

3. **Access the app**
   
   Navigate to `http://localhost:8000` in your browser

## 🎯 Usage

1. **Start Listening** - Click "Start Listening" on the landing page
2. **Choose a Genre** - Select from popular genres like Rock, Pop, Jazz, etc.
3. **Select a Station** - Browse and click on any station to start streaming
4. **Control Playback** - Use the player bar at the bottom to pause/resume
5. **Search Stations** - Use the search bar to find specific stations

## 🏗️ Project Structure

```
cyberpunk-radio/
├── index.html          # Main HTML file
├── styles.css          # Cyberpunk-themed styles
├── radio.js            # Core application logic
└── README.md          # This file
```

## 🎨 Design Features

- **Neon Color Scheme**: Cyan (#00f0ff), Pink (#fd3777), and Yellow (#fcee09) accents
- **Glitch Effects**: Title animations and view transitions
- **Glassmorphism**: Translucent surfaces with backdrop blur
- **Grid Overlay**: Subtle background grid for that retro-futuristic feel
- **Animated Elements**: Loading spinners, equalizer bars, and floating buttons

## 🔧 Configuration

The app uses the Radio Browser API with automatic server selection. Key configuration options in `radio.js`:

```javascript
const API_USER_AGENT = 'USRadioBrowser/1.0';
const MIN_STATIONS_PER_GENRE = 5;
const APP_VERSION = '1.0.0';
```

## 📱 Mobile Support

The app is fully responsive and includes:
- Touch-optimized controls
- Safe area padding for notched devices
- Cordova/PhoneGap compatibility for native app deployment
- Hardware back button support (in Cordova builds)

## 🐛 Known Issues

- Some radio stations may be temporarily offline
- Certain streams might not be compatible with all browsers
- Search is case-sensitive for genre filtering

## 🙏 Acknowledgments

- [Radio Browser API](https://www.radio-browser.info/) for providing the radio station data

---
