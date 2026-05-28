from pynvml import (
    nvmlInit,
    nvmlDeviceGetHandleByIndex,
    nvmlDeviceGetUtilizationRates,
    nvmlDeviceGetMemoryInfo,
    nvmlDeviceGetTemperature,
    nvmlDeviceGetName,
    NVML_TEMPERATURE_GPU
)

nvmlInit()

HANDLE = nvmlDeviceGetHandleByIndex(0)


def get_gpu_metrics():

    utilization = nvmlDeviceGetUtilizationRates(HANDLE)

    memory = nvmlDeviceGetMemoryInfo(HANDLE)

    temperature = nvmlDeviceGetTemperature(
        HANDLE,
        NVML_TEMPERATURE_GPU
    )

    raw_name = nvmlDeviceGetName(HANDLE)
    name = raw_name.decode() if isinstance(raw_name, bytes) else raw_name

    return {
        "name": name,

        "usage": utilization.gpu,

        "memory_used_mb": round(memory.used / 1024 / 1024),

        "memory_total_mb": round(memory.total / 1024 / 1024),

        "memory_percent": round(
            memory.used / memory.total * 100
        ),

        "temperature": temperature
    }