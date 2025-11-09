#!/usr/bin/env python3
"""
Test script for Gemini-TTS functionality
"""

import os
from google.cloud import texttospeech

def test_tts():
    """Test basic TTS functionality"""
    try:
        # Create client
        client = texttospeech.TextToSpeechClient()
        print("TTS Client created successfully")
        
        # Test text
        test_text = "Hello! This is a test of the Gemini text-to-speech system."
        prompt = "You are a friendly storyteller reading to children. Speak in a warm, engaging, and clear voice."
        
        # Create synthesis input
        synthesis_input = texttospeech.SynthesisInput(
            text=test_text,
            prompt=prompt
        )
        
        # Configure voice
        voice = texttospeech.VoiceSelectionParams(
            language_code="en-US",
            name="Kore",  # Child-friendly female voice
            model_name="gemini-2.5-flash-tts"
        )
        
        # Configure audio
        audio_config = texttospeech.AudioConfig(
            audio_encoding=texttospeech.AudioEncoding.MP3
        )
        
        print("Generating speech...")
        
        # Generate speech
        response = client.synthesize_speech(
            input=synthesis_input,
            voice=voice,
            audio_config=audio_config
        )
        
        # Save to file
        output_file = "test_output.mp3"
        with open(output_file, "wb") as out:
            out.write(response.audio_content)
        
        print(f"Audio generated successfully! Saved to: {output_file}")
        print(f"Audio size: {len(response.audio_content)} bytes")
        
        return True
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return False

if __name__ == "__main__":
    print("Testing Gemini-TTS functionality...")
    success = test_tts()
    if success:
        print("All tests passed!")
    else:
        print("Tests failed!")
