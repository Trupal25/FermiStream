import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 8080 });
const rooms = new Map();

console.log('🚀 Signaling server running on port 8080');

wss.on('connection', (ws) => {
  console.log('👤 New client connected');
  
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      handleMessage(ws, message);
    } catch (error) {
      console.error('❌ Invalid message format:', error);
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
    }
  });

  ws.on('close', () => {
    console.log('👋 Client disconnected');
    handleClientDisconnect(ws);
  });

  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
    handleClientDisconnect(ws);
  });
});

function handleMessage(ws, message) {
  const { type, roomId, data } = message;

  switch (type) {
    case 'join':
      handleJoinRoom(ws, roomId);
      break;
    case 'leave':
      handleLeaveRoom(ws, roomId);
      break;
    case 'offer':
    case 'answer':
    case 'ice-candidate':
      relayMessage(ws, message);
      break;
    default:
      console.warn('⚠️ Unknown message type:', type);
  }
}

function handleJoinRoom(ws, roomId) {
  console.log(`🚪 Client joining room: ${roomId}`);
  
  let room = rooms.get(roomId);
  if (!room) {
    room = { id: roomId, clients: new Set() };
    rooms.set(roomId, room);
    console.log(`🏠 Created new room: ${roomId}`);
  }

  room.clients.add(ws);
  ws.roomId = roomId;

  const joinMessage = JSON.stringify({ type: 'join', roomId });
  room.clients.forEach(client => {
    if (client !== ws && client.readyState === ws.OPEN) {
      client.send(joinMessage);
    }
  });

  ws.send(JSON.stringify({ 
    type: 'joined', 
    roomId, 
    clientsCount: room.clients.size 
  }));

  console.log(`👥 Room ${roomId} now has ${room.clients.size} clients`);
}

function handleLeaveRoom(ws, roomId) {
  console.log(`🚪 Client leaving room: ${roomId}`);
  
  const room = rooms.get(roomId);
  if (room) {
    room.clients.delete(ws);
    
    const leaveMessage = JSON.stringify({ type: 'leave', roomId });
    room.clients.forEach(client => {
      if (client.readyState === ws.OPEN) {
        client.send(leaveMessage);
      }
    });

    if (room.clients.size === 0) {
      rooms.delete(roomId);
      console.log(`🗑️ Removed empty room: ${roomId}`);
    } else {
      console.log(`👥 Room ${roomId} now has ${room.clients.size} clients`);
    }
  }
}

function relayMessage(senderWs, message) {
  const roomId = message.roomId || senderWs.roomId;
  
  if (!roomId) {
    console.warn('⚠️ No room ID for relay message');
    return;
  }

  const room = rooms.get(roomId);
  if (!room) {
    console.warn(`⚠️ Room not found: ${roomId}`);
    return;
  }

  console.log(`📡 Relaying ${message.type} in room ${roomId}`);
  
  const messageStr = JSON.stringify(message);
  room.clients.forEach(client => {
    if (client !== senderWs && client.readyState === senderWs.OPEN) {
      client.send(messageStr);
    }
  });
}

function handleClientDisconnect(ws) {
  const roomId = ws.roomId;
  if (roomId) {
    handleLeaveRoom(ws, roomId);
  }
}

// Health check
setInterval(() => {
  const totalRooms = rooms.size;
  const totalClients = Array.from(rooms.values()).reduce((sum, room) => sum + room.clients.size, 0);
  console.log(`📊 Server stats: ${totalRooms} rooms, ${totalClients} clients`);
}, 30000); 