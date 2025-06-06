# TSLA Stock Dashboard

A dashboard for analyzing Tesla stock data with AI-powered insights using the Google Gemini API.

![Screenshot 2025-05-26 163722](https://github.com/user-attachments/assets/9933c50c-aeb4-461a-8d2d-80aa2521221a)


## Features

- Interactive stock price chart with customizable date ranges
- Technical indicators and statistics
- AI-powered trading insights and analysis
- Dark theme with shades of black, charcoal gray, and muted blues

## Project Structure

- `src/` - Frontend React application
- `backend/` - Express.js backend server for API proxying
- `public/` - Static assets

## Development Setup

### Prerequisites

- Node.js 16 or higher
- NPM or Yarn
- Google Gemini API key

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   cd backend && npm install && cd ..
   ```

3. Configure environment variables:
   - Create a `.env` file in the root directory with:
     ```
     VITE_GEMINI_API_KEY=your_gemini_api_key
     VITE_GEMINI_API_URL=http://localhost:3000/api
     ```
   - Create a `.env` file in the `backend` directory with:
     ```
     GEMINI_API_KEY=your_gemini_api_key
     PORT=3000
     ```

4. Start the development servers:
   ```
   npm run start:dev
   ```
   This will start both the frontend and backend servers concurrently.

## Deployment

### Preparing for Deployment

Run the following command to prepare the project for deployment:

```
npm run prepare-deploy
```

This will:
1. Build the frontend
2. Create a `deploy` directory with all necessary files
3. Configure the project for production

### Deployment Options

#### Option 1: Deploy to Netlify (Frontend) and Render (Backend)

1. Deploy the frontend to Netlify:
   - Connect your GitHub repository to Netlify
   - Use the `netlify.toml` configuration file

2. Deploy the backend to Render:
   - Create a new Web Service on Render
   - Point to the `backend` directory
   - Set the build command to `npm install`
   - Set the start command to `node server.js`
   - Configure the environment variables

3. Update the Netlify redirect in `netlify.toml` to point to your Render backend URL

#### Option 2: Deploy as a Single Application

You can deploy the entire application to platforms like Heroku or Render:

1. Navigate to the `deploy` directory created by the `prepare-deploy` script
2. Deploy this directory to your hosting provider
3. Set the required environment variables

## Environment Variables

### Frontend

- `VITE_GEMINI_API_URL`: URL for the backend API
- `VITE_GEMINI_API_KEY`: Google Gemini API key (only needed for direct API calls)

### Backend

- `GEMINI_API_KEY`: Google Gemini API key
- `PORT`: Port for the backend server
- `NODE_ENV`: Set to 'production' for production deployment
- `FRONTEND_URL`: URL of the frontend (for CORS configuration)

## License

MIT
