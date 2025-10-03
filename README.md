# PSAP AI - Emergency Response Locator

A web application for Global Rescue Emergency Response Services that locates Public Safety Answering Points (PSAPs) from GPS coordinates using Google AI Studio (Gemini) API integration.

## 🚨 Features

- **GPS Coordinate Lookup**: Find PSAPs using decimal degrees, cardinal directions, or DMS format
- **Nearby PSAP Search**: Find backup PSAPs within 50-mile radius for redundancy
- **Interactive Maps**: Google Maps integration showing incident locations
- **Multiple Themes**: Light, Dark, and Tactical themes for different operational environments
- **Real-time Data**: Direct integration with Google AI Studio (Gemini) API for accurate PSAP information
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Firebase Authentication**: Secure email/password authentication

## 🎯 Use Case

This internal tool is designed for Global Rescue emergency response teams to quickly identify the appropriate PSAP (Public Safety Answering Point) for any given GPS coordinates. When the primary PSAP is unavailable, the system provides nearby backup options to ensure continuous emergency response capability.

## 🛠 Technology Stack

- **Frontend**: React 18 with Vite
- **Authentication**: Firebase Auth (email/password)
- **Hosting**: Firebase Hosting
- **Maps**: Google Maps JavaScript API
- **AI Integration**: Google AI Studio (Gemini) API
- **Styling**: CSS3 with custom themes

## 🚀 Live Application

**Production URL**: https://psap-ai.web.app

## 📋 Supported Coordinate Formats

1. **Decimal Degrees**: `40.7128, -74.0060`
2. **Cardinal Directions**: `40.7128 N, 74.0060 W`
3. **Degrees/Minutes/Seconds**: `40°42'46.3"N, 74°00'21.6"W`

## 🎨 Themes

- **Light Theme** ☀️: Standard light interface
- **Dark Theme** 🌙: Dark mode for low-light environments
- **Tactical Theme** 🎯: Olive green and tan colors for field operations

## 🔧 Development Setup

### Prerequisites
- Node.js 18+
- Firebase CLI
- Google Maps API key
- Google AI Studio API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Jeffw412/PSAP.git
cd PSAP
```

2. Install dependencies:
```bash
npm install
```

3. Configure Firebase:
```bash
firebase login
firebase use --add
```

4. Start development server:
```bash
npm run dev
```

5. Build for production:
```bash
npm run build
```

6. Deploy to Firebase:
```bash
firebase deploy --only hosting
```

## 🔐 Configuration

### API Keys Setup
For security reasons, API keys are not included in the repository. See `DEPLOYMENT_CONFIG.md` for detailed setup instructions.

1. **Copy environment file**:
   ```bash
   cp .env.local.example .env.local
   ```

2. **Add your API keys** to `.env.local`:
   ```env
   VITE_GOOGLE_AI_API_KEY=your-google-ai-studio-api-key
   VITE_GOOGLE_MAPS_API_KEY=your-google-maps-key
   ```

3. **Update index.html** with your Google Maps API key

### Google AI Studio (Gemini) Integration
- **Expected Response Format**:
  ```
  PSAP: [Name]
  PSAP Website: [Website URL]
  Phone: [Dispatch/Non-Emergency Number(s)]
  Jurisdiction: [Coverage Area]
  ```

### Error Recovery Features

- **Exponential Backoff**: Automatic retry with increasing delays
- **Network Error Handling**: Graceful handling of connection issues
- **Rate Limit Protection**: Automatic retry when hitting API limits
- **No Mock Data**: Real API data only - errors surface properly

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── PSAPLookup.jsx  # Main search interface
│   ├── PSAPResults.jsx # Primary PSAP display
│   ├── NearbyPSAPResults.jsx # Nearby PSAPs display
│   ├── GoogleMap.jsx   # Map integration
│   ├── Login.jsx       # Authentication component
│   └── ThemeToggle.jsx # Theme switching
├── services/           # API services
│   └── psapService.js  # Google AI Studio (Gemini) integration
├── contexts/           # React contexts
│   ├── AuthContext.jsx # Firebase authentication
│   └── ThemeContext.jsx # Theme management
├── utils/              # Utility functions
│   └── coordinateParser.js # GPS coordinate parsing
└── firebase.js         # Firebase configuration
```

## 🔄 Workflow

1. **User Input**: Enter GPS coordinates in any supported format
2. **Primary Search**: Google AI Studio (Gemini) finds the primary PSAP
3. **Display Results**: Show PSAP details with interactive map
4. **Backup Search**: Option to find nearby PSAPs for redundancy
5. **Multiple Options**: Display primary + backup PSAPs with contact info

## 🛡 Security

- Firebase Authentication with email/password
- API keys are hardcoded (internal tool only)
- No sensitive data stored client-side
- HTTPS-only deployment
- Real data only - no mock/test data in production

## 📞 Emergency Response Integration

This tool is specifically designed for Global Rescue emergency response operations:
- No "call 911" warnings (you ARE the response center)
- Tactical theme for field operations
- Backup PSAP options for redundancy
- Real-time accurate data only (no mock/test data)
- Interactive maps for incident location visualization

## 🤝 Contributing

This is an internal Global Rescue tool. For modifications or issues, contact the development team.

## 📄 License

Internal use only - Global Rescue Emergency Response Services

---

**Global Rescue Operations** - Emergency Response Services Locator
