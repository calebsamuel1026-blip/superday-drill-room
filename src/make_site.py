"""Rebuild this private repository's complete personal app."""
import pathlib, subprocess, sys
SRC = pathlib.Path(__file__).resolve().parent
subprocess.run([sys.executable, "-I", str(SRC / "build.py")], check=True)
print("Private app rebuilt with IB Vine and BIWS banks.")
