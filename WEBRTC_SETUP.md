# WebRTC Video Calling App Setup

This is a complete WebRTC video calling application built with Next.js and Node.js WebSocket signaling server.

## 🚀 Features

- **Real-time video calling** between two participants
- **Room-based sessions** with unique room IDs
- **Stream/Watch modes** - one person streams, others can watch
- **Audio/Video controls** - toggle microphone and camera
- **Connection status indicators**
- **Responsive UI** with modern design

## 📋 Prerequisites

- Node.js (v18 or higher)
- Modern web browser with WebRTC support
- Camera and microphone permissions

## 🛠️ Setup Instructions

### 1. Install Dependencies

#### Client (Next.js App)
```bash
cd fermistream
npm install
# or
bun install
```

#### Server (Signaling Server)
```bash
cd fermistream/server
npm install
```

### 2. Start the Signaling Server

```bash
cd fermistream/server
npm start
```

The signaling server will run on `http://localhost:8080`

### 3. Start the Client Application

```bash
cd fermistream
npm run dev
```

The client will run on `http://localhost:3000`

## 🎮 How to Use

### For Video Calls (Stream Mode)

1. Open `http://localhost:3000` in your browser
2. Click **"Stream"** button
3. Either:
   - Generate a new Room ID, or
   - Enter an existing Room ID
4. Click **"Join Room"**
5. Allow camera/microphone permissions
6. Share the Room ID with another person
7. The other person should also click "Stream" and enter the same Room ID

### For Watching Streams (Watch Mode)

1. Open `http://localhost:3000` in another browser/tab
2. Click **"Watch"** button
3. Enter the Room ID of an active stream
4. Click **"Join as Viewer"**

## 🔧 Controls

### During a Call/Stream:
- **📹 Video** - Toggle camera on/off
- **🎤 Audio** - Toggle microphone on/off
- **Leave Call** - End the session

### While Watching:
- **🔊 Audio** - Mute/unmute the stream
- **⛶ Fullscreen** - View stream in fullscreen
- **Stop Watching** - Leave the stream

## 🌐 Network Configuration

The app is configured to work on `localhost`. For production or different network setups:

1. **Update WebSocket URL** in `fermistream/lib/useWebRTC.ts`:
   ```typescript
   const wsUrl = 'ws://your-server-domain:8080';
   ```

2. **Update STUN servers** if needed (currently using Google's free STUN servers)

## 🐛 Troubleshooting

### Common Issues:

1. **"WebSocket connection failed"**
   - Make sure the signaling server is running on port 8080
   - Check if port 8080 is not blocked by firewall

2. **"Failed to access camera/microphone"**
   - Allow camera/microphone permissions in browser
   - Check if other applications are using the camera

3. **"No video/audio from remote participant"**
   - Both participants need to be in the same room
   - Check browser console for WebRTC errors
   - Try refreshing both browser windows

4. **Connection not establishing**
   - Both participants should join within a few seconds of each other
   - Check network connectivity
   - Try using different browsers

### Testing Locally:
- Open two browser windows/tabs
- One person creates/joins a room in "Stream" mode
- Another person joins the same room (either "Stream" or "Watch" mode)

## 📱 Browser Compatibility

Tested on:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🔒 Security Notes

- This is a development setup with basic signaling
- For production, implement proper authentication
- Use HTTPS/WSS for secure connections
- Consider implementing TURN servers for NAT traversal

## 📦 Project Structure

```
fermistream/
├── app/
│   ├── stream/         # Video calling interface
│   ├── watch/          # Stream watching interface
│   └── page.tsx        # Home page
├── lib/
│   └── useWebRTC.ts    # WebRTC hook with signaling logic
├── server/
│   ├── start.js        # Simple signaling server
│   └── src/            # TypeScript server files
└── components/ui/      # Reusable UI components
```

## 🤝 Contributing

Feel free to improve the code, add features, or fix bugs!

## 📄 License

MIT License - feel free to use in your projects! 