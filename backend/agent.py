import asyncio
import os
import logging
from dotenv import load_dotenv

from livekit.agents import AutoSubscribe, JobContext, WorkerOptions, cli, llm
from livekit.agents.pipeline import VoicePipelineAgent
from livekit.plugins import deepgram, openai, silero

# Load environment variables
load_dotenv()

# Configure logging
logger = logging.getLogger("ai-interviewer")
logger.setLevel(logging.INFO)

async def entrypoint(ctx: JobContext):
    """
    This is the main entrypoint for the AI Agent when it joins a LiveKit room.
    """
    logger.info(f"Agent connecting to room {ctx.room.name}")
    
    # Connect to the room
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)
    logger.info("Agent connected successfully!")

    # Wait for the first participant to join
    participant = await ctx.wait_for_participant()
    logger.info(f"Participant joined: {participant.identity}")

    # Set up the Voice Pipeline Agent
    # STT: Deepgram (fast, great accuracy)
    # LLM: OpenAI GPT-4o
    # TTS: OpenAI TTS (or you can swap for ElevenLabs later)
    # VAD: Silero (Voice Activity Detection)
    
    agent = VoicePipelineAgent(
        vad=silero.VAD.load(),
        stt=deepgram.STT(),
        llm=openai.LLM(model="gpt-4o"),
        tts=openai.TTS(),
        chat_ctx=llm.ChatContext().append(
            role="system",
            text=(
                "You are an expert technical interviewer conducting an online interview. "
                "Your name is Sam. You should act professional, friendly, but rigorous. "
                "Ask technical questions related to software engineering, listen to the candidate's answers, "
                "and ask follow-up questions. Keep your responses concise since this is a voice conversation. "
                "Start by introducing yourself and asking the candidate to introduce themselves."
            ),
        ),
    )

    # Start the agent in the room
    agent.start(ctx.room, participant)
    
    # Optionally, the agent can speak first
    await agent.say("Hello, I'm Sam, your AI interviewer today. Could you please start by introducing yourself?", allow_interruptions=True)

if __name__ == "__main__":
    # Start the LiveKit worker CLI
    # Run with: python agent.py start
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))
