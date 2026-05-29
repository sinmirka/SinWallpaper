from pathlib import Path
import subprocess
import ctypes
import sys
import time

def is_admin():
    try:
        return ctypes.windll.shell32.IsUserAnAdmin()
    except:
        return False

def request_admin_privileges():
    try:
        result = ctypes.windll.shell32.ShellExecuteW(
            None, "runas", sys.executable, " ".join(sys.argv), None, 1
        )
        return result > 32  # Success if result > 32
    except Exception as e:
        print("Error:", str(e))
        return False


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
        result = subprocess.run(command, shell=True)
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
    print(f"Executable: {sys.executable}")
    print(f"Args: {sys.argv}")
    if not is_admin():
        print("[WARN] Admin priveleges are required for work!")
        success = request_admin_privileges()
        if success:
            print(f"[OK] Requested admin priveleges. Relaunching...")
        else:
            print(f"[WARN] Admin privilege request was denied!")
        time.sleep(2)
        sys.exit()
    else:
        print("[OK] Running with admin privileges!")

    print("""SinPaper Bootstrapper
    1. Enable Startup
    2. Disable Startup
    3. Exit""")
    while True:
        choice = input("\n> ".strip())

        match choice:
            case "1":
                install_startup()
            case _:
                print("Invalid choice")


if __name__ == "__main__":
    main()