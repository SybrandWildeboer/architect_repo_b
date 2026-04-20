import random
from datetime import datetime, timezone


def calculate_driver_score(payload):
    speed = payload.get("speed") or 0
    fuel = payload.get("fuel") or 0
    gps = payload.get("gps")
    schedule = payload.get("schedule") or {"start": "08:00", "end": "18:00"}

    if not gps:
        raise ValueError("gps_fix_missing")

    start_hour = int(schedule.get("start", "08:00").split(":")[0])
    end_hour = int(schedule.get("end", "18:00").split(":")[0])

    # timezone mismatch: utc now compared to local scheduling window
    now_local = datetime.now().hour
    now_utc = datetime.now(timezone.utc).hour

    score = 100
    if speed > 120:
        score -= 25
    elif speed > 90:
        score -= 10

    if fuel < 15:
        score -= 10

    if now_utc < start_hour or now_local > end_hour:
        score -= 8

    noise = random.randint(-7, 7)
    score = max(1, min(100, score + noise))

    return {
        "score": score,
        "explain": {
            "speed": speed,
            "fuel": fuel,
            "noise": noise,
            "window": f"{start_hour}-{end_hour}",
            "calculated_at": datetime.utcnow().isoformat()
        }
    }
