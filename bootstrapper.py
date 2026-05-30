from pathlib import Path
from typing import Literal
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
    
def close_app():
    print("Closing...")
    time.sleep(1)
    sys.exit()


ROOT = Path(__file__).resolve().parent
MAIN_ROOT = ROOT / "backend" / 'main.py'
PYTHON_ROOT = ROOT / ".venv" / "Scripts" / "pythonw.exe"
TASK_NAME = 'SinPaper Startup'

def task_scheduler_handler(action: Literal["create", "delete"]):
    """Creates or deletes task from Task Scheduler."""
    if action == "create":
        command = (
            f'schtasks /create '
            f'/tn "{TASK_NAME}" '
            f'/tr "\\"{PYTHON_ROOT}\\" \\"{MAIN_ROOT}\\"" '
            f'/sc onlogon /f'
        )
    elif action == "delete":
        command = f'schtasks /delete /tn "{TASK_NAME}" /f'
    else:
        raise ValueError(
            f'Unknown action: {action}'
        )
    print(command)

    try:
        result = subprocess.run(command, shell=True)
        if result.returncode == 0:
            print("[OK] Command executed successfully")
        else:
            print(
                f"[ERROR] Command failed"
                f"({result.returncode})"
            )
    except Exception as e:
        print(f"[ERROR] {e}")


def install_startup():
    try:
        task_scheduler_handler("create")
        print('[OK] Added startup task on logon')
    except Exception as e:
        print(f"[ERROR] {e}")

def uninstall_startup():
    try:
        task_scheduler_handler("delete")
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
                close_app()
            case "":
                pass
            case _:
                print("Invalid choice")


if __name__ == "__main__":
    main()