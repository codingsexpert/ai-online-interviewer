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
import { Loader2, VideoOff, Mic, MicOff } from "lucide-react";

// Conditionally import HeyGen SDK only if needed
import StreamingAvatar, { AvatarQuality, StreamingEvents, TaskType, TaskMode } from "@heygen/streaming-avatar";

export default function InterviewRoom() {
  const hasHeyGenKey = !!process.env.NEXT_PUBLIC_HEYGEN_API_KEY;

  if (hasHeyGenKey) {
    return <HeyGenInterviewRoom />;
  } else {
    return <LiveKitInterviewRoom />;
  }
}

// ==========================================
// HEYGEN INTERACTIVE AVATAR ROOM (TRIAL MODE)
// ==========================================
function HeyGenInterviewRoom() {
  const [avatar, setAvatar] = useState<StreamingAvatar | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    async function startHeyGen() {
      try {
        setLoading(true);
        // Initialize HeyGen Streaming Avatar
        const avatarSdk = new StreamingAvatar({
          token: process.env.NEXT_PUBLIC_HEYGEN_API_KEY || "",
        });

        // Listen for video stream
        avatarSdk.on(StreamingEvents.STREAM_READY, (event) => {
          setStream(event.detail);
          if (videoRef.current) {
            videoRef.current.srcObject = event.detail;
          }
        });

        avatarSdk.on(StreamingEvents.STREAM_DISCONNECTED, () => {
          setStream(null);
        });

        // Create the avatar session
        await avatarSdk.createStartAvatar({
          quality: AvatarQuality.High,
          avatarName: process.env.NEXT_PUBLIC_HEYGEN_AVATAR_ID || "Wayne_20240711",
          voice: {
             voiceId: "1bd001e7e50f421d891986aad5158bc8", // Example male voice
             rate: 1.0
          },
          language: "en",
        });

        setAvatar(avatarSdk);
        
        // Initial greeting using Repeater mode
        await avatarSdk.speak({
          text: "Hello, I am Wayne, your AI interviewer. It's a pleasure to meet you. Please introduce yourself.",
          taskType: TaskType.REPEAT,
          taskMode: TaskMode.ASYNC,
        });

        setLoading(false);
      } catch (err: any) {
        console.error("HeyGen Setup Error:", err);
        setError("Failed to start HeyGen Avatar. Please check your API key or token limits.");
        setLoading(false);
      }
    }

    startHeyGen();

    return () => {
      if (avatar) {
        avatar.stopAvatar();
      }
    };
  }, []);

  const toggleRecording = async () => {
    if (!avatar) return;
    if (isRecording) {
      await avatar.stopListening();
      setIsRecording(false);
    } else {
      await avatar.startListening();
      setIsRecording(true);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-red-400 p-6 text-center">
        <div className="max-w-md p-6 border border-red-500/20 bg-red-500/10 rounded-2xl">
          <h2 className="text-xl font-bold mb-2">HeyGen Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
        <p className="text-gray-400 animate-pulse">Initializing HeyGen Interactive Avatar...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="flex flex-col h-full bg-neutral-900 rounded-2xl overflow-hidden" style={{ height: "calc(100vh - 32px)" }}>
        {/* Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-white/10 bg-black/50">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
            <span className="font-medium">HeyGen Interview Room</span>
          </div>
        </div>

        {/* Video Grid */}
        <div className="flex-1 p-4 flex items-center justify-center relative">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full h-full">
            
            {/* HeyGen Avatar Video */}
            <div className="relative rounded-2xl overflow-hidden bg-black/40 border border-white/10 flex items-center justify-center aspect-video">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10 text-sm font-medium flex items-center gap-2">
                Wayne (AI Interviewer)
              </div>
            </div>

            {/* User Audio Control Panel (HeyGen doesn't natively mirror your camera easily without separate getUserMedia, so we just show mic status) */}
            <div className="relative rounded-2xl overflow-hidden bg-black/40 border border-white/10 flex flex-col items-center justify-center aspect-video">
              <div className="text-gray-400 mb-4 text-center px-4">
                Click the microphone to talk to the Avatar. HeyGen will listen, process your speech, and reply.
              </div>
              <button 
                onClick={toggleRecording}
                className={`p-6 rounded-full transition-all ${isRecording ? 'bg-red-500 hover:bg-red-600 animate-pulse' : 'bg-blue-500 hover:bg-blue-600'}`}
              >
                {isRecording ? <Mic className="w-8 h-8 text-white" /> : <MicOff className="w-8 h-8 text-white" />}
              </button>
              <div className="mt-4 font-medium text-white">
                {isRecording ? "Listening..." : "Microphone Off"}
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}


// ==========================================
// LIVEKIT INTERVIEW ROOM (FREE AUDIO-REACTIVE FALLBACK)
// ==========================================
function LiveKitInterviewRoom() {
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
          <div className="h-16 px-6 flex items-center justify-between border-b border-white/10 bg-black/50">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
              <span className="font-medium">Interview in progress</span>
            </div>
            <ConnectionStatus />
          </div>
          <div className="flex-1 p-4 flex items-center justify-center relative">
            <LiveKitVideoGrid />
          </div>
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

function LiveKitVideoGrid() {
  const tracks = useTracks([
    { source: Track.Source.Camera, withPlaceholder: true },
    { source: Track.Source.Microphone, withPlaceholder: false }
  ]);

  const [volume, setVolume] = useState(0);

  useEffect(() => {
    const remoteAudio = tracks.find(
      (t) => t.source === Track.Source.Microphone && t.participant.isLocal === false
    );

    if (remoteAudio && remoteAudio.publication?.track) {
      const mediaStreamTrack = remoteAudio.publication.track.mediaStreamTrack;
      if (!mediaStreamTrack) return;

      const mediaStream = new MediaStream([mediaStreamTrack]);
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(mediaStream);
      const analyser = audioContext.createAnalyser();
      
      analyser.fftSize = 256;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      let animationId: number;

      const updateVolume = () => {
        analyser.getByteFrequencyData(dataArray);
        const sum = dataArray.reduce((a, b) => a + b, 0);
        const avg = sum / dataArray.length;
        setVolume(Math.min(avg / 100, 1.2));
        animationId = requestAnimationFrame(updateVolume);
      };

      updateVolume();

      return () => {
        cancelAnimationFrame(animationId);
        source.disconnect();
        analyser.disconnect();
        audioContext.close();
      };
    }
  }, [tracks]);

  const localCamera = tracks.find((t) => t.source === Track.Source.Camera && t.participant.isLocal);
  const aiVideo = tracks.find((t) => t.source === Track.Source.Camera && !t.participant.isLocal);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full h-full p-4">
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

      <div className="relative rounded-2xl overflow-hidden bg-black/40 border border-white/10 flex items-center justify-center aspect-video">
        {aiVideo && aiVideo.publication && !aiVideo.publication.isMuted ? (
           <VideoTrack trackRef={aiVideo} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center justify-center w-full h-full relative">
            <div 
              className="absolute w-32 h-32 rounded-full bg-blue-500/20"
              style={{ transform: `scale(${1 + volume * 1.5})`, opacity: Math.max(0.1, volume) }}
            ></div>
            <div 
              className="absolute w-32 h-32 rounded-full bg-blue-500/40"
              style={{ transform: `scale(${1 + volume * 0.8})`, opacity: Math.max(0.2, volume) }}
            ></div>
            <div 
              className="relative z-10 w-32 h-32 rounded-full overflow-hidden border-4 transition-colors duration-200"
              style={{ borderColor: volume > 0.1 ? '#3b82f6' : 'rgba(255,255,255,0.1)' }}
            >
              <img 
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop" 
                alt="AI Avatar"
                className="w-full h-full object-cover"
                crossOrigin="anonymous"
              />
            </div>
          </div>
        )}
        <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10 text-sm font-medium flex items-center gap-2">
          Sam (AI Interviewer)
          <span 
             className="w-2 h-2 rounded-full transition-colors duration-200" 
             style={{ backgroundColor: volume > 0.1 ? '#22c55e' : '#6b7280' }}
          />
        </div>
      </div>
    </div>
  );
}
