"""Synthetic 10-min 'stream': 1280x720 video, quiet audio with loud bursts at 200s and 430s,
and a chat log with baseline chatter + crazy spikes ~7s after each event."""
import json, random, subprocess, sys
from pathlib import Path
out = Path(sys.argv[1] if len(sys.argv) > 1 else "tests/fixtures")
out.mkdir(parents=True, exist_ok=True)
D = 600
vol = "if(between(t,198,206)+between(t,428,433),0.9,0.05)"
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i", f"testsrc2=size=1280x720:rate=30:duration={D}",
                "-f", "lavfi", "-i", f"sine=frequency=330:duration={D}", "-filter:a", f"volume='{vol}':eval=frame",
                "-c:v", "libx264", "-preset", "ultrafast", "-crf", "35", "-c:a", "aac", "-shortest",
                str(out / "stream.mp4")], check=True)
random.seed(7)
base = ["alguém sabe a build?", "boa noite", "salve", "que carro é esse", "joga com nois", "lol", "vamo",
        "primeira vez aqui", "esse mapa é gigante", "GTA 6 finalmente"]
spam = ["KKKKKKKKKKK", "KKKKKKKKKKKKKKKKK", "MDS", "CARALHO", "CLIPA ISSO", "SOCORRO KKKK", "💀💀💀", "PQP", "MORRI"]
msgs = []
for t in range(D):
    for _ in range(random.randint(0, 3)):
        msgs.append({"t": t + random.random(), "author": f"u{random.randint(1, 400)}", "text": random.choice(base)})
for ev, n in ((207, 25), (437, 18)):
    for t in range(ev, ev + 12):
        for _ in range(n):
            msgs.append({"t": t + random.random(), "author": f"u{random.randint(1, 3000)}", "text": random.choice(spam)})
msgs.sort(key=lambda m: m["t"])
(out / "chat.jsonl").write_text("".join(json.dumps(m, ensure_ascii=False) + "\n" for m in msgs))
print("fixture ready:", out, len(msgs), "messages")
