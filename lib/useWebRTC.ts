import { useEffect, useRef, useState, useCallback } from 'react';

interface SignalingData {
  type: 'offer' | 'answer' | 'ice-candidate' | 'join' | 'leave' | 'joined';
  data?: any;
  roomId?: string;
}

interface UseWebRTCProps {
  roomId: string;
  localVideoRef: React.RefObject<HTMLVideoElement | null>;
  remoteVideoRef: React.RefObject<HTMLVideoElement | null>;
}

export const useWebRTC = ({ roomId, localVideoRef, remoteVideoRef }: UseWebRTCProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLocalStreamActive, setIsLocalStreamActive] = useState(false);
  const [isRemoteStreamActive, setIsRemoteStreamActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const localStream = useRef<MediaStream | null>(null);
  const websocket = useRef<WebSocket | null>(null);
  const isInitiator = useRef(false);

  const servers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection(servers);
    
    pc.onicecandidate = (event) => {
      if (event.candidate && websocket.current?.readyState === WebSocket.OPEN) {
        websocket.current.send(JSON.stringify({
          type: 'ice-candidate',
          data: event.candidate,
          roomId
        }));
      }
    };

    pc.ontrack = (event) => {
      console.log('Received remote stream');
      const [remoteStream] = event.streams;
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
        setIsRemoteStreamActive(true);
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('Connection state:', pc.connectionState);
      setIsConnected(pc.connectionState === 'connected');
    };

    return pc;
  }, [roomId, remoteVideoRef]);

  const initializeLocalStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      localStream.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        setIsLocalStreamActive(true);
      }

      // Add tracks to peer connection
      if (peerConnection.current) {
        stream.getTracks().forEach(track => {
          peerConnection.current?.addTrack(track, stream);
        });
      }

      return stream;
    } catch (err) {
      console.error('Error accessing media devices:', err);
      setError('Failed to access camera/microphone');
      throw err;
    }
  }, [localVideoRef]);

  const createOffer = useCallback(async () => {
    if (!peerConnection.current) return;

    try {
      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);
      
      if (websocket.current?.readyState === WebSocket.OPEN) {
        websocket.current.send(JSON.stringify({
          type: 'offer',
          data: offer,
          roomId
        }));
      }
    } catch (err) {
      console.error('Error creating offer:', err);
      setError('Failed to create offer');
    }
  }, [roomId]);

  const createAnswer = useCallback(async (offer: RTCSessionDescriptionInit) => {
    if (!peerConnection.current) return;

    try {
      await peerConnection.current.setRemoteDescription(offer);
      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);
      
      if (websocket.current?.readyState === WebSocket.OPEN) {
        websocket.current.send(JSON.stringify({
          type: 'answer',
          data: answer,
          roomId
        }));
      }
    } catch (err) {
      console.error('Error creating answer:', err);
      setError('Failed to create answer');
    }
  }, [roomId]);

  const handleAnswer = useCallback(async (answer: RTCSessionDescriptionInit) => {
    if (!peerConnection.current) return;

    try {
      await peerConnection.current.setRemoteDescription(answer);
    } catch (err) {
      console.error('Error handling answer:', err);
      setError('Failed to handle answer');
    }
  }, []);

  const handleIceCandidate = useCallback(async (candidate: RTCIceCandidateInit) => {
    if (!peerConnection.current) return;

    try {
      await peerConnection.current.addIceCandidate(candidate);
    } catch (err) {
      console.error('Error adding ice candidate:', err);
    }
  }, []);

  const connectWebSocket = useCallback(() => {
    // Use localhost for development - adjust URL as needed
    const wsUrl = 'ws://localhost:8080';
    
    try {
      websocket.current = new WebSocket(wsUrl);

      websocket.current.onopen = () => {
        console.log('✅ WebSocket connected successfully');
        setError(null); // Clear any previous errors
        websocket.current?.send(JSON.stringify({
          type: 'join',
          roomId
        }));
      };

      websocket.current.onmessage = async (event) => {
        try {
          const message: SignalingData = JSON.parse(event.data);
          console.log('📨 Received message:', message.type);
          
          switch (message.type) {
            case 'offer':
              await createAnswer(message.data);
              break;
            case 'answer':
              await handleAnswer(message.data);
              break;
            case 'ice-candidate':
              await handleIceCandidate(message.data);
              break;
            case 'join':
              // If someone joins and we're already here, we become the initiator
              if (peerConnection.current && localStream.current) {
                isInitiator.current = true;
                console.log('🚀 Becoming initiator, creating offer...');
                await createOffer();
              }
              break;
            case 'joined':
              console.log('✅ Successfully joined room:', message.roomId);
              break;
          }
        } catch (err) {
          console.error('❌ Error handling WebSocket message:', err);
        }
      };

      websocket.current.onclose = (event) => {
        console.log('🔌 WebSocket disconnected. Code:', event.code, 'Reason:', event.reason);
        setIsConnected(false);
        if (event.code !== 1000) { // 1000 is normal closure
          setError(`WebSocket disconnected unexpectedly (Code: ${event.code})`);
        }
      };

      websocket.current.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        setError('Failed to connect to signaling server. Make sure the server is running on localhost:8080');
      };
      
    } catch (err) {
      console.error('❌ Failed to create WebSocket:', err);
      setError('Failed to create WebSocket connection');
    }
  }, [roomId, createAnswer, handleAnswer, handleIceCandidate, createOffer]);

  const startCall = useCallback(async () => {
    try {
      setError(null);
      
      // Initialize peer connection
      peerConnection.current = createPeerConnection();
      
      // Get local stream
      await initializeLocalStream();
      
      // Connect WebSocket for signaling
      connectWebSocket();
      
    } catch (err) {
      console.error('Error starting call:', err);
      setError('Failed to start call');
    }
  }, [createPeerConnection, initializeLocalStream, connectWebSocket]);

  const endCall = useCallback(() => {
    // Close peer connection
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }

    // Stop local stream
    if (localStream.current) {
      localStream.current.getTracks().forEach(track => track.stop());
      localStream.current = null;
    }

    // Close WebSocket
    if (websocket.current) {
      websocket.current.close();
      websocket.current = null;
    }

    // Reset states
    setIsConnected(false);
    setIsLocalStreamActive(false);
    setIsRemoteStreamActive(false);
    setError(null);

    // Clear video elements
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
  }, [localVideoRef, remoteVideoRef]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      endCall();
    };
  }, [endCall]);

  return {
    startCall,
    endCall,
    isConnected,
    isLocalStreamActive,
    isRemoteStreamActive,
    error
  };
}; 