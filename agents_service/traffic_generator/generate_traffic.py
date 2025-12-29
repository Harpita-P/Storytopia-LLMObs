import base64
import os
import random
import time
from pathlib import Path

import requests


BACKEND_URL = os.environ.get("STORYTOPIA_BACKEND_URL", "http://localhost:8000")
IMAGES_DIR = Path(__file__).parent / "images"

# Pre-set lesson themes to exercise Quest Creator
LESSON_THEMES = [
    "kindness",
    "sharing",
    "bravery",
    "perseverance",
    "friendship",
]


def load_images() -> list[Path]:
    """Return a list of image paths under traffic_generator/images."""
    if not IMAGES_DIR.exists():
        print(f"[traffic] Images directory does not exist yet: {IMAGES_DIR}")
        return []

    image_files: list[Path] = []
    for ext in ("*.png", "*.jpg", "*.jpeg", "*.webp"):
        image_files.extend(IMAGES_DIR.glob(ext))

    image_files = sorted(image_files)
    print(f"[traffic] Found {len(image_files)} image(s) in {IMAGES_DIR}")
    return image_files


def call_generate_character(image_path: Path, user_id: str) -> dict | None:
    """Call /generate-character with a drawing image and return JSON response."""
    url = f"{BACKEND_URL}/generate-character"
    with image_path.open("rb") as f:
        b64 = base64.b64encode(f.read()).decode("utf-8")

    data = {
        "drawing_data": b64,
        "user_id": user_id,
    }

    print(f"[traffic] POST {url} (user_id={user_id}, image={image_path.name})")
    resp = requests.post(url, data=data, timeout=300)
    print(f"[traffic] /generate-character status={resp.status_code}")
    if not resp.ok:
        print(f"[traffic] Error body: {resp.text[:500]}")
        return None

    try:
        payload = resp.json()
    except Exception as e:
        print(f"[traffic] Failed to parse /generate-character JSON: {e}")
        print(resp.text[:500])
        return None

    return payload


def call_create_quest(character_description: str, character_name: str, lesson: str, character_image_uri: str | None) -> dict | None:
    """Call /create-quest using data from Visionizer + chosen lesson."""
    url = f"{BACKEND_URL}/create-quest"
    body = {
        "character_description": character_description,
        "character_name": character_name,
        "lesson": lesson,
        "character_image_uri": character_image_uri,
    }

    print(f"[traffic] POST {url} (name={character_name}, lesson={lesson})")
    resp = requests.post(url, json=body, timeout=600)
    print(f"[traffic] /create-quest status={resp.status_code}")
    if not resp.ok:
        print(f"[traffic] Error body: {resp.text[:500]}")
        return None

    try:
        payload = resp.json()
    except Exception as e:
        print(f"[traffic] Failed to parse /create-quest JSON: {e}")
        print(resp.text[:500])
        return None

    return payload


def call_tts(text: str, voice_name: str = "Kore") -> dict | None:
    """Call /text-to-speech with some narration text to exercise TTS + tts_status eval."""
    url = f"{BACKEND_URL}/text-to-speech"
    body = {
        "text": text,
        "voice_name": voice_name,
    }

    print(f"[traffic] POST {url} (len(text)={len(text)})")
    resp = requests.post(url, json=body, timeout=120)
    print(f"[traffic] /text-to-speech status={resp.status_code}")
    if not resp.ok:
        print(f"[traffic] Error body: {resp.text[:500]}")
        return None

    try:
        payload = resp.json()
    except Exception as e:
        print(f"[traffic] Failed to parse /text-to-speech JSON: {e}")
        print(resp.text[:500])
        return None

    return payload


def generate_traffic(num_iterations: int = 5, sleep_seconds: float = 5.0) -> None:
    """Generate synthetic traffic through the main Storytopia flow.

    For each iteration:
      1) Pick an image from traffic_generator/images.
      2) Call /generate-character with that drawing.
      3) Use the returned character_description + generated_character_uri.
      4) Pick a lesson from LESSON_THEMES and call /create-quest.
      5) Call /text-to-speech with a short narration line to trigger TTS.
    """
    images = load_images()
    if not images:
        print("[traffic] No images found. Drop PNG/JPEG files into 'agents_service/traffic_generator/images' and re-run.")
        return

    for i in range(num_iterations):
        image = images[i % len(images)]
        user_id = f"traffic_user_{i}"
        lesson = random.choice(LESSON_THEMES)

        print("\n" + "=" * 80)
        print(f"[traffic] Iteration {i + 1}/{num_iterations} | image={image.name} | lesson={lesson}")

        # 1) Visionizer /generate-character
        gen_resp = call_generate_character(image, user_id=user_id)
        if not gen_resp or gen_resp.get("status") != "success":
            print("[traffic] Skipping rest of flow due to generate-character failure.")
            time.sleep(sleep_seconds)
            continue

        character_description = gen_resp.get("analysis", {}).get("character_description") or gen_resp.get("character_description") or "A brave kid hero"
        character_name = gen_resp.get("character_type") or "Coco"
        character_image_uri = gen_resp.get("generated_character_uri") or None

        # 2) Quest Creator /create-quest
        quest_resp = call_create_quest(
            character_description=character_description,
            character_name=character_name,
            lesson=lesson,
            character_image_uri=character_image_uri,
        )

        narration_text = f"This is a short Storytopia narration about {character_name} learning {lesson}."
        call_tts(narration_text, voice_name="Kore")

        time.sleep(sleep_seconds)


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Storytopia traffic generator")
    parser.add_argument("--iterations", type=int, default=5, help="Number of end-to-end flows to run")
    parser.add_argument("--sleep", type=float, default=5.0, help="Seconds to sleep between iterations")

    args = parser.parse_args()

    print(f"[traffic] Using backend: {BACKEND_URL}")
    print(f"[traffic] Images directory: {IMAGES_DIR}")
    generate_traffic(num_iterations=args.iterations, sleep_seconds=args.sleep)
