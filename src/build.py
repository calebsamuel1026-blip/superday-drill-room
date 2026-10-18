"""Assemble the single-file app.

    python -I build.py            -> ../index.html  (personal copy, includes the IB Vine bank)
    python -I build.py --public   -> ../public/index.html  (no IB Vine or BIWS content; safe to share)

Accounts are wired in only when src/config.json holds the Supabase project URL
and the public anon key: {"supabaseUrl": "...", "supabaseAnonKey": "..."}
"""
import json, pathlib, re, sys

SRC = pathlib.Path(__file__).resolve().parent
ROOT = SRC.parent
public = "--public" in sys.argv

shell = (SRC / "shell.html").read_text(encoding="utf-8")
data = (SRC / "data.js").read_text(encoding="utf-8")
if public:
    # Drop the personal IB Vine export; keep TRACKS + the core BANK.
    data = re.sub(r"(?ms)^const VINE_BANK = \[.*\];\s*$", "const VINE_BANK = [];\n", data)
    assert "iv-t-" not in data and "iv-b-" not in data, "IB Vine content leaked into public build"
# BIWS guide questions are paid content: personal copy only.
biws_path = SRC / "data-biws.js"
if not public and biws_path.exists():
    data += "\n" + biws_path.read_text(encoding="utf-8")
if public:
    assert "BIWS_BANK = [{" not in data and '"source":"biws"' not in data, "BIWS content leaked into public build"
engine = (SRC / "engine.js").read_text(encoding="utf-8")
cloud = (SRC / "cloud.js").read_text(encoding="utf-8")
app = (SRC / "app.js").read_text(encoding="utf-8")

cfg_path = SRC / "config.json"
cfg = json.loads(cfg_path.read_text(encoding="utf-8")) if cfg_path.exists() else {}
cloud_head = ""
if cfg.get("supabaseUrl") and cfg.get("supabaseAnonKey"):
    assert "service_role" not in cfg["supabaseAnonKey"], "never ship the service_role key"
    conf = json.dumps({"supabaseUrl": cfg["supabaseUrl"], "supabaseAnonKey": cfg["supabaseAnonKey"]})
    cloud_head = ('<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js"></script>\n'
                  f"<script>window.SDR_CONFIG = {conf};</script>\n")

script = lambda js: "<script>\n" + js + "\n</script>"
out = (shell.replace("<!--@DATA-->", script(data))
            .replace("<!--@ENGINE-->", script(engine) + "\n" + cloud_head + script(cloud))
            .replace("<!--@APP-->", script(app)))
dest = ROOT / "public" / "index.html" if public else ROOT / "index.html"
dest.parent.mkdir(exist_ok=True)
dest.write_text(out, encoding="utf-8")
print(f"wrote {dest} ({dest.stat().st_size:,} bytes){' with accounts' if cloud_head else ''}")
