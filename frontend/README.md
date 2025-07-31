# Photo Gallery Frontend

A modern React application for displaying photos from Google Drive.

## Features

- 🖼️ Beautiful photo grid layout
- 🔄 Real-time refresh functionality
- 📱 Responsive design for all devices
- ⚡ Fast loading with lazy image loading
- 🎨 Modern UI with smooth animations
- 🔗 Direct links to original photos

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- Backend server running on `http://localhost:8000`

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:3000`

### Building for Production

To create a production build:

```bash
npm run build
```

The built files will be in the `dist` folder.

## Development

The application is built with:
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Axios** for HTTP requests
- **Lucide React** for beautiful icons
- **CSS3** with modern features like Grid and Flexbox

## API Integration

The frontend connects to the backend API at `http://localhost:8000/photos/sync` to fetch photos from Google Drive. Make sure your backend server is running before starting the frontend.

## Project Structure

```
src/
├── App.tsx          # Main application component
├── App.css          # Application styles
├── index.css        # Global styles
└── main.tsx         # Application entry point
```

## Environment Variables

No environment variables are required for the frontend. The API endpoint is hardcoded to `http://localhost:8000` for development.
