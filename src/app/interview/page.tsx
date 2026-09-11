"use client";

import { useEffect, useState } from "react";
import {
  LiveKitRoom,
  VideoTrack,
  useTracks,
  RoomAudioRenderer,
  ControlBar,
  useConnectionState,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { Track } from "livekit-client";
import { Loader2, Mic, MicOff, Video, VideoOff } from "lucide-react";

export default function InterviewRoom() {
  const [token, setToken] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    // In production, this would be an authenticated user
    const participantName = "Candidate_" + Math.floor(Math.random() * 1000);
    const roomName = "interview_room_1";

    fetch("http://localhost:8000/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ participant_name: participantName, room_name: roomName }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch token from Python backend. Make sure the FastAPI server is running.");
        return res.json();
      })
      .then((data) => setToken(data.token))
      .catch((err) => setError(err.message));
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-red-400 p-6 text-center">
        <div className="max-w-md p-6 border border-red-500/20 bg-red-500/10 rounded-2xl">
          <h2 className="text-xl font-bold mb-2">Connection Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (token === "") {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
        <p className="text-gray-400 animate-pulse">Connecting to LiveKit server...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4">
      {/* LiveKitRoom context manages the WebRTC connection */}
      <LiveKitRoom
        video={true}
        audio={true}
        token={token}
        serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
        data-lk-theme="default"
        style={{ height: "calc(100vh - 32px)", borderRadius: "16px", overflow: "hidden" }}
      >
        <div className="flex flex-col h-full bg-neutral-900">
          {/* Header */}
          <div className="h-16 px-6 flex items-center justify-between border-b border-white/10 bg-black/50">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
              <span className="font-medium">Interview in progress</span>
            </div>
            <ConnectionStatus />
          </div>

          {/* Video Grid */}
          <div className="flex-1 p-4 flex items-center justify-center relative">
            <VideoGrid />
          </div>

          {/* Control Bar (Mic/Camera toggles) */}
          <div className="bg-black/50 p-4 flex justify-center">
             <ControlBar />
          </div>
          
          <RoomAudioRenderer />
        </div>
      </LiveKitRoom>
    </div>
  );
}

function ConnectionStatus() {
  const state = useConnectionState();
  return (
    <div className="text-sm text-gray-400 bg-white/5 px-3 py-1 rounded-full border border-white/10">
      Status: <span className="text-white capitalize">{state}</span>
    </div>
  );
}

function VideoGrid() {
  // Find all camera tracks (the user's camera + the AI agent's synthesized video if present)
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full h-full p-4">
      {tracks.map((track) => (
        <div
          key={track.participant.identity}
          className="relative rounded-2xl overflow-hidden bg-black/40 border border-white/10 flex items-center justify-center aspect-video"
        >
          {track.publication?.isMuted ? (
            <div className="flex flex-col items-center text-gray-500">
              <VideoOff className="w-12 h-12 mb-2" />
              <span>Camera Off</span>
            </div>
          ) : (
            <VideoTrack
              trackRef={track}
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
          {/* Participant Label */}
          <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10 text-sm font-medium flex items-center gap-2">
            {track.participant.identity}
            {track.participant.isSpeaking && (
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
