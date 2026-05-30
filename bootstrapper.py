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
    
def exit():
    print("Closing...")
    time.sleep(1)
    sys.exit()


ROOT = Path(__file__).resolve().parent
MAIN_ROOT = ROOT / "backend" / 'main.py'
PYTHON_ROOT = ROOT / ".venv" / "Scripts" / "pythonw.exe"
SERVICE_ROOT = ROOT / "service" / "startup.bat"
TASK_NAME = 'SinPaper Startup'

def generate_bat_content() -> str: # .bat file that launches the script
    return f"""@echo off

cd /d {ROOT}

"{PYTHON_ROOT}" "{MAIN_ROOT}"
"""

def create_startup_bat():
    with open(SERVICE_ROOT, "w") as f:
        f.write(generate_bat_content())
        print("[OK] Startup bat created")

def task_scheduler_handler(choice):
    if choice == True:
        if not SERVICE_ROOT.exists():
            create_startup_bat()
        command = f'schtasks /create /tn "{TASK_NAME}" /tr "{SERVICE_ROOT}" /sc onlogon /f'
    else:
        command = f'schtasks /delete /tn "{TASK_NAME}" /f'

    try:
        result = subprocess.run(command, shell=True)
        print(f"[DEBUG] Return code {result.returncode}")
    except Exception as e:
        print(f"[ERROR] {e}")


def install_startup():
    try:
        create_startup_bat()
        try:
            task_scheduler_handler(choice=True)
            print('[OK] Added startup task on logon')
        except Exception as e:
            print(f"[ERROR] {e}")
    except Exception as e:
        print(f"[ERROR] {e}")

def uninstall_startup():
    try:
        task_scheduler_handler(choice=False)
        print("[OK] Removed startup task on logon")
    except Exception as e:
        print(f"[ERROR] {e}")


# === Main Menu ===
def main():
    print(f"[DEBUG] Executable: {sys.executable}")
    print(f"[DEBUG] Args: {sys.argv}")
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
        print("[OK] Running with admin privileges")

    print("""
    ===== SinPaper Bootstrapper =====
    1. Enable Startup
    2. Disable Startup
    3. Exit""")
    while True:
        choice = input("\n> ".strip())

        match choice:
            case "1": # Enable Startup
                install_startup()
            case "2": # Disable Startup
                uninstall_startup()
            case "3": # Exit
                exit()
            case "":
                pass
            case _:
                print("Invalid choice")


if __name__ == "__main__":
    main()