import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';

interface SignalingMessage {
  type: 'join' | 'leave' | 'offer' | 'answer' | 'ice-candidate';
  roomId?: string;
  data?: any;
}

interface Room {
  id: string;
  clients: Set<WebSocket>;
}

class SignalingServer {
  private wss: WebSocketServer;
  private rooms: Map<string, Room> = new Map();

  constructor(port: number = 8080) {
    this.wss = new WebSocketServer({ port });
    this.setupEventHandlers();
    console.log(`🚀 Signaling server running on port ${port}`);
  }

  private setupEventHandlers() {
    this.wss.on('connection', (ws: WebSocket, request: IncomingMessage) => {
      console.log('👤 New client connected');
      
      ws.on('message', (data: Buffer) => {
        try {
          const message: SignalingMessage = JSON.parse(data.toString());
          this.handleMessage(ws, message);
        } catch (error) {
          console.error('❌ Invalid message format:', error);
          ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
        }
      });

      ws.on('close', () => {
        console.log('👋 Client disconnected');
        this.handleClientDisconnect(ws);
      });

      ws.on('error', (error) => {
        console.error('❌ WebSocket error:', error);
        this.handleClientDisconnect(ws);
      });
    });
  }

  private handleMessage(ws: WebSocket, message: SignalingMessage) {
    const { type, roomId, data } = message;

    switch (type) {
      case 'join':
        this.handleJoinRoom(ws, roomId!);
        break;
      case 'leave':
        this.handleLeaveRoom(ws, roomId!);
        break;
      case 'offer':
      case 'answer':
      case 'ice-candidate':
        this.relayMessage(ws, message);
        break;
      default:
        console.warn('⚠️ Unknown message type:', type);
    }
  }

  private handleJoinRoom(ws: WebSocket, roomId: string) {
    console.log(`🚪 Client joining room: ${roomId}`);
    
    // Get or create room
    let room = this.rooms.get(roomId);
    if (!room) {
      room = { id: roomId, clients: new Set() };
      this.rooms.set(roomId, room);
      console.log(`🏠 Created new room: ${roomId}`);
    }

    // Add client to room
    room.clients.add(ws);
    (ws as any).roomId = roomId; // Store roomId on websocket for cleanup

    // Notify other clients in the room
    const joinMessage = JSON.stringify({ type: 'join', roomId });
    room.clients.forEach(client => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(joinMessage);
      }
    });

    // Send confirmation to joining client
    ws.send(JSON.stringify({ 
      type: 'joined', 
      roomId, 
      clientsCount: room.clients.size 
    }));

    console.log(`👥 Room ${roomId} now has ${room.clients.size} clients`);
  }

  private handleLeaveRoom(ws: WebSocket, roomId: string) {
    console.log(`🚪 Client leaving room: ${roomId}`);
    
    const room = this.rooms.get(roomId);
    if (room) {
      room.clients.delete(ws);
      
      // Notify other clients
      const leaveMessage = JSON.stringify({ type: 'leave', roomId });
      room.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(leaveMessage);
        }
      });

      // Remove room if empty
      if (room.clients.size === 0) {
        this.rooms.delete(roomId);
        console.log(`🗑️ Removed empty room: ${roomId}`);
      } else {
        console.log(`👥 Room ${roomId} now has ${room.clients.size} clients`);
      }
    }
  }

  private relayMessage(senderWs: WebSocket, message: SignalingMessage) {
    const roomId = message.roomId || (senderWs as any).roomId;
    
    if (!roomId) {
      console.warn('⚠️ No room ID for relay message');
      return;
    }

    const room = this.rooms.get(roomId);
    if (!room) {
      console.warn(`⚠️ Room not found: ${roomId}`);
      return;
    }

    console.log(`📡 Relaying ${message.type} in room ${roomId}`);
    
    // Relay to all other clients in the room
    const messageStr = JSON.stringify(message);
    room.clients.forEach(client => {
      if (client !== senderWs && client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });
  }

  private handleClientDisconnect(ws: WebSocket) {
    const roomId = (ws as any).roomId;
    if (roomId) {
      this.handleLeaveRoom(ws, roomId);
    }
  }

  public getRoomStats() {
    const stats = Array.from(this.rooms.entries()).map(([roomId, room]) => ({
      roomId,
      clientCount: room.clients.size
    }));
    
    return {
      totalRooms: this.rooms.size,
      totalClients: Array.from(this.rooms.values()).reduce((sum, room) => sum + room.clients.size, 0),
      rooms: stats
    };
  }
}

// Start the server
const server = new SignalingServer(8080);

// Health check endpoint
setInterval(() => {
  const stats = server.getRoomStats();
  console.log(`📊 Server stats: ${stats.totalRooms} rooms, ${stats.totalClients} clients`);
}, 30000); // Log every 30 seconds

export default SignalingServer; 