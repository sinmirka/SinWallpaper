from pathlib import Path
import subprocess

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
        print("[OK] Startup bat created")

def add_bat_to_ts(): #ts is task scheduler, not "this shit" lol...
    if not SERVICE_ROOT.exists():
        create_startup_bat()
    command = f'schtasks /create /tn "SinPaper Startup" /tr "{SERVICE_ROOT}" /sc onlogon /f'
    print(f"[DEBUG] Command: {command}")
    try:
        result = subprocess.run(command)
        print(f"[DEBUG] Return code {result.returncode}")
    except Exception as e:
        print(f"[ERROR] {e}")

def install_startup():
    try:
        create_startup_bat()
        add_bat_to_ts()
    except Exception as e:
        print(f"[ERROR] {e}")

def main():
    print("""SinPaper Bootstrapper
    1. Enable Startup
    2. Disable Startup
    3. Exit""")
    while True:
        choice = input("\n> ".strip())

        match choice:
            case "1":
                install_startup()


if __name__ == "__main__":
    main()