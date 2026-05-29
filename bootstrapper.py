from pathlib import Path

ROOT = Path(__file__).resolve().parent
MAIN_ROOT = ROOT / "backend" / 'main.py'
PYTHON_ROOT = ROOT / ".venv" / "Scripts" / "pythonw.exe"
SERVICE_ROOT = ROOT / "service" / "startup.bat"

def generate_bat_content() -> str:
    return f"""@echo off

cd /d {ROOT}

"{PYTHON_ROOT}" "{MAIN_ROOT}"
"""

def create_startup_bat():
    with open(SERVICE_ROOT, "w") as f:
        f.write(generate_bat_content())
        f.close()

def add_bat_to_ts(): #ts is task scheduler, not "this shit" lol...
    command = f'schtasks /create /tn "SinPaper Startup" /tr "{SERVICE_ROOT}" /sc onlogon /f'