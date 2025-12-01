# CMU Tour Guide App

A React Native Expo app that uses computer vision and AI to provide information about Carnegie Mellon University buildings and landmarks.

## Features

- **Camera Scanning**: Point your camera at any building or landmark on campus
- **AI Chat Interface**: Get detailed information about buildings with mock AI responses
- **CMU Branding**: Beautiful UI with Carnegie Mellon's signature red color (#C41E3A)
- **Smooth Navigation**: Seamless flow between scanning and chat

## Screens

2. **Home Screen**: Main interface with "Scan a Photo" button
3. **Camera Screen**: Built-in camera with scanning frame and capture functionality
4. **Chat Screen**: AI-powered chat interface with mock responses about CMU buildings

## Tech Stack

- React Native with Expo
- Expo Router for navigation
- Expo Camera for photo capture
- TypeScript for type safety
- Custom styling with CMU branding

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the development server:

   ```bash
   npx expo start
   ```

3. Run on your preferred platform:
   ```bash
   npx expo start --ios
   npx expo start --android
   npx expo start --web
   ```

## Project Structure

```
app/
├── _layout.tsx      # Root layout with navigation
├── index.tsx        # Home screen
├── camera.tsx       # Camera scanning screen
└── chat.tsx         # AI chat interface
```

## Features in Detail

### Camera Functionality

- Real-time camera preview
- Scanning frame overlay
- Photo capture with processing animation
- Camera flip functionality
- Permission handling

### Chat Interface

- Mock AI responses about CMU buildings
- Real-time typing indicators
- Message timestamps
- Smooth scrolling
- Input validation

### Design

- CMU color scheme (#C41E3A)
- Modern, clean interface
- Responsive design
- Smooth animations
- Professional typography
