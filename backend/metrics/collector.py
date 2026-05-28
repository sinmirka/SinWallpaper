from metrics.cpu import get_cpu_usage
from metrics.ram import get_ram_usage
from metrics.disk import get_disk_usage

def get_sys_metrics():
    return {
        "cpu_usage": get_cpu_usage(),
        "ram_usage": get_ram_usage(),
        "disk": get_disk_usage(),
    }