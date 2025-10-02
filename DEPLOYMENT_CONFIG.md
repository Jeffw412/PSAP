# PSAP AI Deployment Configuration

## API Keys Setup

This application requires several API keys to function properly. For security reasons, these are not included in the repository.

### Required API Keys

1. **OpenAI API Key**: For ChatGPT Assistant integration
2. **OpenAI Assistant ID**: The specific assistant trained for PSAP lookups
3. **Google Maps API Key**: For displaying incident location maps

### Local Development Setup

1. Copy `.env.local.example` to `.env.local`:
```bash
cp .env.local.example .env.local
```

2. Edit `.env.local` with your actual API keys:
```env
VITE_OPENAI_API_KEY=your-actual-openai-api-key
VITE_OPENAI_ASSISTANT_ID=your-actual-assistant-id
VITE_GOOGLE_MAPS_API_KEY=your-actual-google-maps-api-key
```

3. Update `index.html` with your Google Maps API key:
```html
<script async defer src="https://maps.googleapis.com/maps/api/js?key=YOUR_ACTUAL_GOOGLE_MAPS_API_KEY&libraries=geometry"></script>
```

### Production Deployment (Firebase)

For production deployment, you'll need to:

1. **Set environment variables** in your deployment environment
2. **Update index.html** with the production Google Maps API key
3. **Configure Firebase** with the OpenAI credentials

### Current Production Values (Internal Use)

For Global Rescue internal deployment, contact the development team for the actual API keys:

- **OpenAI API Key**: Contact dev team for production key
- **Assistant ID**: Contact dev team for production assistant ID
- **Google Maps API Key**: Contact dev team for production maps key

### Security Notes

- Never commit API keys to version control
- Use environment variables for all sensitive configuration
- The `.env.local` file is gitignored for security
- For internal tools, keys can be hardcoded in deployment but not in repository

### Deployment Steps

1. **Local Development**:
   ```bash
   npm install
   npm run dev
   ```

2. **Production Build**:
   ```bash
   # Update index.html with production Google Maps API key
   # Update .env.local with production values
   npm run build
   firebase deploy --only hosting
   ```

3. **Live Application**: https://psap-ai.web.app
