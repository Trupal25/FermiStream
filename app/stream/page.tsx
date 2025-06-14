"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useWebRTC } from "@/lib/useWebRTC"

export default function Stream() {
    const router = useRouter()
    const [roomId, setRoomId] = useState('')
    const [isInCall, setIsInCall] = useState(false)
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
        localVideoRef,
        remoteVideoRef
    })

    const handleJoinRoom = async () => {
        if (!roomId.trim()) {
            alert('Please enter a room ID')
            return
        }
        
        setShowRoomInput(false)
        setIsInCall(true)
        await startCall()
    }

    const handleLeaveCall = () => {
        endCall()
        setIsInCall(false)
        setShowRoomInput(true)
        setRoomId('')
    }

    const generateRoomId = () => {
        const id = Math.random().toString(36).substring(2, 15)
        setRoomId(id)
    }

    if (showRoomInput) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
                    <h1 className="text-2xl font-bold text-center mb-6">Join Video Call</h1>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Room ID
                            </label>
                            <input
                                type="text"
                                value={roomId}
                                onChange={(e) => setRoomId(e.target.value)}
                                placeholder="Enter room ID"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        
                        <div className="flex gap-2">
                            <Button 
                                onClick={generateRoomId}
                                variant="outline"
                                className="flex-1"
                            >
                                Generate ID
                            </Button>
                            <Button 
                                onClick={handleJoinRoom}
                                className="flex-1"
                                disabled={!roomId.trim()}
                            >
                                Join Room
                            </Button>
                        </div>
                        
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
                    Room: {roomId}
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
                        onClick={handleLeaveCall}
                        variant="destructive"
                    >
                        Leave Call
                    </Button>
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div className="bg-red-500 text-white p-3 rounded mb-4">
                    {error}
                </div>
            )}

            {/* Video Container */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100vh-120px)]">
                {/* Local Video */}
                <div className="relative bg-gray-800 rounded-lg overflow-hidden">
                    <video 
                        ref={localVideoRef}
                        autoPlay 
                        playsInline 
                        muted
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                        You {isLocalStreamActive ? '(Active)' : '(Inactive)'}
                    </div>
                    {!isLocalStreamActive && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="bg-gray-600 w-24 h-24 rounded-full flex items-center justify-center">
                                <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                </svg>
                            </div>
                        </div>
                    )}
                </div>

                {/* Remote Video */}
                <div className="relative bg-gray-800 rounded-lg overflow-hidden">
                    <video 
                        ref={remoteVideoRef}
                        autoPlay 
                        playsInline
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                        Remote {isRemoteStreamActive ? '(Active)' : '(Waiting...)'}
                    </div>
                    {!isRemoteStreamActive && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center text-gray-400">
                                <div className="bg-gray-600 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-2">
                                    <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <p>Waiting for remote participant...</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Control Panel */}
            <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4">
                <Button
                    onClick={() => {
                        const video = localVideoRef.current?.srcObject as MediaStream
                        if (video) {
                            const videoTrack = video.getVideoTracks()[0]
                            if (videoTrack) {
                                videoTrack.enabled = !videoTrack.enabled
                            }
                        }
                    }}
                    className="bg-gray-700 hover:bg-gray-600"
                >
                    📹 Video
                </Button>
                <Button
                    onClick={() => {
                        const audio = localVideoRef.current?.srcObject as MediaStream
                        if (audio) {
                            const audioTrack = audio.getAudioTracks()[0]
                            if (audioTrack) {
                                audioTrack.enabled = !audioTrack.enabled
                            }
                        }
                    }}
                    className="bg-gray-700 hover:bg-gray-600"
                >
                    🎤 Audio
                </Button>
            </div>
        </div>
    )
}