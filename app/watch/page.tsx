"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useWebRTC } from "@/lib/useWebRTC"

export default function Watch() {
    const router = useRouter()
    const [roomId, setRoomId] = useState('')
    const [isWatching, setIsWatching] = useState(false)
    const [showRoomInput, setShowRoomInput] = useState(true)
    
    const localVideoRef = useRef<HTMLVideoElement | null>(null)
    const remoteVideoRef = useRef<HTMLVideoElement | null>(null)
    
    const { 
        startCall, 
        endCall, 
        isConnected, 
        isLocalStreamActive, 
        isRemoteStreamActive, 
        error 
    } = useWebRTC({
        roomId,
        localVideoRef: localVideoRef as React.RefObject<HTMLVideoElement>,
        remoteVideoRef: remoteVideoRef as React.RefObject<HTMLVideoElement>
    })

    const handleJoinRoom = async () => {
        if (!roomId.trim()) {
            alert('Please enter a room ID to watch')
            return
        }
        
        setShowRoomInput(false)
        setIsWatching(true)
        await startCall()
    }

    const handleLeaveWatch = () => {
        endCall()
        setIsWatching(false)
        setShowRoomInput(true)
        setRoomId('')
    }

    if (showRoomInput) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
                    <h1 className="text-2xl font-bold text-center mb-6">Watch Stream</h1>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Room ID to Watch
                            </label>
                            <input
                                type="text"
                                value={roomId}
                                onChange={(e) => setRoomId(e.target.value)}
                                placeholder="Enter room ID to watch"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        
                        <Button 
                            onClick={handleJoinRoom}
                            className="w-full"
                            disabled={!roomId.trim()}
                        >
                            Join as Viewer
                        </Button>
                        
                        <Button 
                            onClick={() => router.push('/')}
                            variant="outline"
                            className="w-full"
                        >
                            Back to Home
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-900 p-4">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-white text-xl font-semibold">
                    Watching Room: {roomId}
                </h1>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${
                            isConnected ? 'bg-green-500' : 'bg-red-500'
                        }`}></div>
                        <span className="text-white text-sm">
                            {isConnected ? 'Connected' : 'Disconnected'}
                        </span>
                    </div>
                    <Button 
                        onClick={handleLeaveWatch}
                        variant="destructive"
                    >
                        Stop Watching
                    </Button>
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div className="bg-red-500 text-white p-3 rounded mb-4">
                    {error}
                </div>
            )}

            {/* Main Video - Remote Stream (what we're watching) */}
            <div className="relative bg-gray-800 rounded-lg overflow-hidden h-[70vh] mb-4">
                <video 
                    ref={remoteVideoRef}
                    autoPlay 
                    playsInline
                    className="w-full h-full object-cover"
                />
                <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                    Stream {isRemoteStreamActive ? '(Live)' : '(Connecting...)'}
                </div>
                {!isRemoteStreamActive && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center text-gray-400">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                            <p className="text-lg">Connecting to stream...</p>
                            <p className="text-sm">Room ID: {roomId}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Small Preview - Local Camera (optional for viewers) */}
            {isLocalStreamActive && (
                <div className="fixed bottom-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden">
                    <video 
                        ref={localVideoRef}
                        autoPlay 
                        playsInline 
                        muted
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white px-1 py-0.5 rounded text-xs">
                        You
                    </div>
                </div>
            )}

            {/* Viewer Controls */}
            <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4">
                <Button
                    onClick={() => {
                        if (remoteVideoRef.current) {
                            remoteVideoRef.current.muted = !remoteVideoRef.current.muted
                        }
                    }}
                    className="bg-gray-700 hover:bg-gray-600"
                >
                    🔊 Audio
                </Button>
                <Button
                    onClick={() => {
                        if (remoteVideoRef.current) {
                            if (remoteVideoRef.current.requestFullscreen) {
                                remoteVideoRef.current.requestFullscreen()
                            }
                        }
                    }}
                    className="bg-gray-700 hover:bg-gray-600"
                >
                    ⛶ Fullscreen
                </Button>
            </div>
        </div>
    )
} 