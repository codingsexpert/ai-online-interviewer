"use client";

import { useEffect, useState, useRef } from "react";
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
import { Loader2, VideoOff } from "lucide-react";
import { SimliClient } from "simli-client";

export default function InterviewRoom() {
  const [token, setToken] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const participantName = "Candidate_" + Math.floor(Math.random() * 1000);
    const roomName = "interview_room_1";

    fetch("http://localhost:8000/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ participant_name: participantName, room_name: roomName }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch token from backend.");
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

          {/* Control Bar */}
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
  const tracks = useTracks([
    { source: Track.Source.Camera, withPlaceholder: true },
    { source: Track.Source.Microphone, withPlaceholder: false }
  ]);

  const simliVideoRef = useRef<HTMLVideoElement>(null);
  const simliAudioRef = useRef<HTMLAudioElement>(null);
  const [simliClient, setSimliClient] = useState<SimliClient | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !simliVideoRef.current || !simliAudioRef.current) return;
    
    // Initialize Simli Client
    const client = new SimliClient();
    client.Initialize({
      apiKey: process.env.NEXT_PUBLIC_SIMLI_API_KEY || "",
      faceID: process.env.NEXT_PUBLIC_SIMLI_FACE_ID || "5514e24d-6086-46a3-ace4-6a7264e5cb7c", // default fallback face
      handleSilence: true,
      videoRef: simliVideoRef,
      audioRef: simliAudioRef,
    });
    
    setSimliClient(client);
    client.start();

    return () => {
      client.close();
    };
  }, []);

  // Intercept remote audio tracks (Agent's audio) to feed into Simli
  useEffect(() => {
    if (!simliClient) return;

    // Find the remote audio track (the AI agent's voice)
    const remoteAudio = tracks.find(
      (t) => t.source === Track.Source.Microphone && t.participant.isLocal === false
    );

    if (remoteAudio && remoteAudio.publication?.track) {
      const mediaStreamTrack = remoteAudio.publication.track.mediaStreamTrack;
      if (!mediaStreamTrack) return;

      const mediaStream = new MediaStream([mediaStreamTrack]);
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const source = audioContext.createMediaStreamSource(mediaStream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      
      source.connect(processor);
      processor.connect(audioContext.destination);

      processor.onaudioprocess = (e) => {
        const floatData = e.inputBuffer.getChannelData(0);
        const pcm16 = new Int16Array(floatData.length);
        for (let i = 0; i < floatData.length; i++) {
          pcm16[i] = Math.max(-1, Math.min(1, floatData[i])) * 32767;
        }
        simliClient.sendAudioData(new Uint8Array(pcm16.buffer));
      };

      return () => {
        source.disconnect();
        processor.disconnect();
        audioContext.close();
      };
    }
  }, [tracks, simliClient]);

  // Separate local camera track and remote tracks
  const localCamera = tracks.find((t) => t.source === Track.Source.Camera && t.participant.isLocal);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full h-full p-4">
      {/* Local User Camera */}
      <div className="relative rounded-2xl overflow-hidden bg-black/40 border border-white/10 flex items-center justify-center aspect-video">
        {localCamera && localCamera.publication && !localCamera.publication.isMuted ? (
          <VideoTrack trackRef={localCamera} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center text-gray-500">
            <VideoOff className="w-12 h-12 mb-2" />
            <span>You (Camera Off)</span>
          </div>
        )}
        <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10 text-sm font-medium">
          You
        </div>
      </div>

      {/* AI Interviewer Avatar (Simli Video) */}
      <div className="relative rounded-2xl overflow-hidden bg-black/40 border border-white/10 flex items-center justify-center aspect-video">
        <video 
          ref={simliVideoRef} 
          autoPlay 
          playsInline 
          className="absolute inset-0 w-full h-full object-cover"
        ></video>
        <audio ref={simliAudioRef} autoPlay className="hidden"></audio>
        
        <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10 text-sm font-medium flex items-center gap-2">
          Sam (AI Interviewer)
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
