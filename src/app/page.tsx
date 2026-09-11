import Link from "next/link";
import { ArrowRight, Video, Shield, Zap } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-blue-500/30">
      {/* Navigation */}
      <nav className="flex items-center justify-between p-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-500 to-violet-500 flex items-center justify-center">
            <Video className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-semibold tracking-tight">Interviewer.ai</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm text-gray-300 hover:text-white transition-colors">
            Sign In
          </Link>
          <Link
            href="/interview"
            className="px-4 py-2 text-sm font-medium bg-white text-black rounded-full hover:bg-gray-100 transition-colors"
          >
            Try Demo
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 pt-32 pb-24 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm text-gray-300 mb-8 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          LiveKit WebRTC Infrastructure
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-8 leading-tight">
          Conversational AI Video Agents <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400">
            for Real Interviews.
          </span>
        </h1>
        
        <p className="max-w-2xl mx-auto text-lg md:text-xl text-gray-400 mb-12 leading-relaxed">
          Build human-like AI video agents that talk, react, and take action in real time. 
          Powered by ultra-low latency WebRTC and advanced LLMs.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/interview"
            className="group flex items-center gap-2 px-8 py-4 bg-white text-black rounded-full text-lg font-medium hover:scale-105 transition-all duration-200"
          >
            Start Mock Interview
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="https://github.com/livekit/agents"
            target="_blank"
            className="px-8 py-4 bg-white/5 border border-white/10 rounded-full text-lg font-medium hover:bg-white/10 transition-colors"
          >
            View Documentation
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mt-32 text-left">
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
            <Zap className="w-8 h-8 text-blue-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Ultra-Low Latency</h3>
            <p className="text-gray-400 leading-relaxed">
              Sub-500ms latency powered by LiveKit's global WebRTC network for natural conversations.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
            <Video className="w-8 h-8 text-violet-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Real-time Video</h3>
            <p className="text-gray-400 leading-relaxed">
              Stream synthesized avatar video directly to the browser with perfect lip-sync.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
            <Shield className="w-8 h-8 text-green-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Python Worker</h3>
            <p className="text-gray-400 leading-relaxed">
              Fully programmable backend using FastAPI and the LiveKit Agents Python SDK.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
