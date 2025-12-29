"""Text-to-Speech Tool
Converts text to speech using Google Cloud Gemini-TTS API
"""

import os
import base64
from typing import Optional

from google.cloud import texttospeech
from ddtrace.llmobs import LLMObs

from .storage_tool import upload_to_gcs

_tts_client = None

def get_tts_client():
    """Get or create TTS client"""
    global _tts_client
    if _tts_client is None:
        _tts_client = texttospeech.TextToSpeechClient()
    return _tts_client

def text_to_speech(text: str, voice_name: str = "Kore") -> dict:
    """
    Convert text to speech using Gemini-TTS and return GCS URI with duration
    
    Args:
        text: Text to convert to speech
        voice_name: Voice to use (default: Kore - child-friendly female voice)
    
    Returns:
        Dictionary with audio_uri and estimated_duration_seconds
    """
    try:
        client = get_tts_client()
        
        # Create child-friendly prompt for storytelling
        prompt = "You are a friendly storyteller reading to children. Speak in a warm, engaging, and clear voice with appropriate emotion and pacing for young listeners."
        
        # Set up the synthesis input with Gemini-TTS prompt
        synthesis_input = texttospeech.SynthesisInput(
            text=text,
            prompt=prompt
        )
        
        # Build the voice request using Gemini-TTS model
        voice = texttospeech.VoiceSelectionParams(
            language_code="en-US",
            name=voice_name,  # Use Gemini-TTS voices like "Kore", "Aoede", "Zephyr"
            model_name="gemini-2.5-flash-tts"  # Use Gemini-TTS model
        )
        
        # Select the type of audio file
        audio_config = texttospeech.AudioConfig(
            audio_encoding=texttospeech.AudioEncoding.MP3
        )
        
        # Perform the text-to-speech request
        response = client.synthesize_speech(
            input=synthesis_input,
            voice=voice,
            audio_config=audio_config,
        )

        # Upload audio to GCS
        audio_uri = upload_to_gcs(
            file_data=response.audio_content,
            filename="audio.mp3",
            content_type="audio/mpeg",
        )
        
        # Estimate duration: average speaking rate is ~150 words per minute for children's content
        word_count = len(text.split())
        estimated_duration = (word_count / 150) * 60  # Convert to seconds

        # Datadog LLM Observability: submit TTS success evaluation
        try:
            span_ctx = LLMObs.export_span(span=None)
            LLMObs.submit_evaluation(
                span=span_ctx,
                ml_app="storytopia-backend",
                label="tts_status",
                metric_type="score",
                value=1.0,
                tags={
                    "component": "tts_tool",
                    "voice": str(voice_name),
                    "status": "success",
                },
                assessment="pass",
                reasoning="Text-to-speech synthesis and upload to GCS succeeded.",
            )
        except Exception:
            # Never fail the request due to observability issues
            pass

        return {
            "audio_uri": audio_uri,
            "duration_seconds": estimated_duration,
            "word_count": word_count,
        }

    except Exception as e:
        # Datadog LLM Observability: submit TTS failure evaluation
        try:
            span_ctx = LLMObs.export_span(span=None)
            LLMObs.submit_evaluation(
                span=span_ctx,
                ml_app="storytopia-backend",
                label="tts_status",
                metric_type="score",
                value=0.0,
                tags={
                    "component": "tts_tool",
                    "voice": str(voice_name),
                    "status": "failure",
                },
                assessment="fail",
                reasoning=f"Text-to-speech synthesis failed: {str(e)}",
            )
        except Exception:
            pass

        raise Exception(f"Failed to generate speech: {str(e)}")

def generate_scene_audio(scene_text: str, option1_text: str, option2_text: str) -> dict:
    """
    Generate audio for a scene's story text and both options using Gemini-TTS
    
    Args:
        scene_text: Main story text for the scene
        option1_text: Text for first option
        option2_text: Text for second option
    
    Returns:
        Dictionary with audio URIs for each text element
    """
    try:
        # Use different child-friendly voices for variety
        voices = ["Kore", "Aoede", "Zephyr"]  # Female voices that are good for children
        
        result = {
            "scene_audio": text_to_speech(scene_text, voice_name=voices[0]),
            "option1_audio": text_to_speech(option1_text, voice_name=voices[1]),
            "option2_audio": text_to_speech(option2_text, voice_name=voices[2])
        }
        
        return result
        
    except Exception as e:
        raise Exception(f"Failed to generate scene audio: {str(e)}")
