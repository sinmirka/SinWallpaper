import psutil

def get_sys_info():
    return {
        "cpu_usage": psutil.cpu_percent(interval=0.9),
        "ram_usage": psutil.virtual_memory().percent,
        "disk": psutil.disk_usage('/').percent,
    }
