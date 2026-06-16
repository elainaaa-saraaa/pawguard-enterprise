import time
import json
import random
import requests

API_URL = "http://192.168.1.11:3000/api/telemetry"

# Persistent state trackers
bark_count = 0
whine_count = 0
growl_count = 0
is_runaway = False

# The classification categories our TinyML model outputs
SOUND_CLASSES = ["Silence", "Background Noise", "Human Speech", "Bark", "Whine", "Growl"]

def generate_telemetry():
    global bark_count, whine_count, growl_count, is_runaway
    
    # 1. Base Environment Telemetry
    room_temp = round(random.uniform(22.0, 26.5), 1)
    lux = random.randint(400, 550) 
    
    # Defaults for a calm, safe pet
    activity_level = "Normal"
    movement_score = random.randint(15, 45)
    stress_score = "LOW"
    comfort_score = random.randint(85, 98)
    collar_led = "GREEN"
    distance_from_hub = round(random.uniform(0.5, 12.0), 1)
    geofence_alert = "SAFE"
    
    # Default Audio Inference outputting baseline environment sound
    tinyml_classification = random.choice(["Silence", "Background Noise"])
    inference_confidence = round(random.uniform(0.85, 0.99), 2)
    
    # 2. Inject Random Runaway Event (2% chance)
    if not is_runaway and random.random() < 0.02:
        is_runaway = True
        print("\n🚨 [SIMULATOR CRITICAL] Geofence Breach Detected!")

    # 3. Handle Active States
    if is_runaway:
        activity_level = "Running"
        movement_score = random.randint(90, 100)
        stress_score = "HIGH"
        comfort_score = random.randint(10, 30)
        collar_led = "FLASHING_RED"
        distance_from_hub = round(random.uniform(150.0, 800.0), 1) 
        geofence_alert = "BREACHED"
        
        # When running away, the audio model will highly likely hear Whines or heavy Barks
        tinyml_classification = random.choice(["Bark", "Whine"])
        inference_confidence = round(random.uniform(0.75, 0.96), 2)
        if tinyml_classification == "Bark": bark_count += 1
        if tinyml_classification == "Whine": whine_count += 1
        
        if random.random() < 0.10:
            is_runaway = False
            print("\n💚 [SIMULATOR EVENT] Pet has been safely recovered.")
            
    else:
        # Standard mood/acoustic shifts if home safe (15% event chance)
        rand_event = random.random()
        if rand_event < 0.05:
            # Playful / Guarding Event -> Barking
            activity_level = "Restless"
            movement_score = random.randint(70, 90)
            tinyml_classification = "Bark"
            inference_confidence = round(random.uniform(0.90, 0.99), 2)
            bark_count += 1
            stress_score = "HIGH" if random.random() > 0.5 else "LOW"
            collar_led = "RED" if stress_score == "HIGH" else "GREEN"
            print(f"\n🔊 [TinyML Inference] Class: BARK ({int(inference_confidence*100)}% Match)")
            
        elif rand_event < 0.10:
            # Separation Anxious / Distress Event -> Whining
            activity_level = "Isolating"
            movement_score = random.randint(5, 15)
            tinyml_classification = "Whine"
            inference_confidence = round(random.uniform(0.80, 0.95), 2)
            whine_count += 1
            stress_score = "HIGH"
            comfort_score = random.randint(40, 60)
            collar_led = "RED"
            print(f"\n🔊 [TinyML Inference] Class: WHINE ({int(inference_confidence*100)}% Match)")
            
        elif rand_event < 0.15:
            # Warning/Defensive Event -> Growling
            activity_level = "Alert"
            movement_score = random.randint(40, 65)
            tinyml_classification = "Growl"
            inference_confidence = round(random.uniform(0.85, 0.97), 2)
            growl_count += 1
            stress_score = "HIGH"
            collar_led = "RED"
            print(f"\n🔊 [TinyML Inference] Class: GROWL ({int(inference_confidence*100)}% Match)")
            
        elif random.random() < 0.03:
            # Human Interaction event
            tinyml_classification = "Human Speech"
            inference_confidence = round(random.uniform(0.88, 0.98), 2)
            print(f"\n🗣️ [TinyML Inference] Class: HUMAN SPEECH ({int(inference_confidence*100)}% Match)")

    payload = {
        "timestamp": int(time.time()),
        "device_info": {
            "hub_id": "PG-HUB-00192X",
            "status": "Online" if not is_runaway else "AWAY",
            "battery_pct": random.randint(88, 92)
        },
        "environment": {
            "temperature_c": room_temp,
            "ambient_light_lux": lux
        },
        "audio_analytics": {
            "microphone_hardware": "INMP441_I2S",
            "detected_classification": tinyml_classification,
            "inference_confidence_pct": int(inference_confidence * 100),
            "historical_counts": {
                "barks": bark_count,
                "whines": whine_count,
                "growls": growl_count
            }
        },
        "collar_metrics": {
            "activity_state": activity_level,
            "movement_score_pct": movement_score,
            "led_status": collar_led,
            "distance_from_hub_meters": distance_from_hub,
            "geofence_status": geofence_alert
        },
        "edge_analytics": {
            "stress_level": stress_score,
            "comfort_score_pct": comfort_score
        }
    }
    return payload

print("🚀 PawGuard TinyML Smart-Acoustic Simulator Booted.")
print(f"Listening to digital I2S stream on channel '{API_URL}'...\n")

try:
    while True:
        data = generate_telemetry()
        try:
            response = requests.post(API_URL, json=data, timeout=4)
            if response.status_code == 200:
                print(f"📡 Transmission Sent [200 OK] | Audio State: {data['audio_analytics']['detected_classification']}")
            else:
                print(f"⚠️ Server Response Error: {response.status_code}")
        except requests.exceptions.RequestException:
            print(f"❌ Next.js server offline. Ensure 'npm run dev' is running.")

        time.sleep(5)
except KeyboardInterrupt:
    print("\nShutting down hardware simulator...")