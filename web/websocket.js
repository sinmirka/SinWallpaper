const RECONNECT_INTERVAL = 30000; // 30 seconds

const BACKEND_STATE = {
  connected: false,
  system: {},
  reconnectTimer: null,
  reconnectTimeLeft: 0,
};

let socket = null;

function createSocket() {
  socket = new WebSocket('ws://localhost:8765');

  socket.addEventListener('open', () => {
    console.log('[WS] Connected');
    BACKEND_STATE.connected = true;
    resetReconnectTimer();
  });

  socket.addEventListener('close', () => {
    console.log('[WS] Disconnected');
    BACKEND_STATE.connected = false;
    startReconnectTimer();
  });

  socket.addEventListener('message', (event) => {
    const data = JSON.parse(event.data);

    if (data.system) {
      BACKEND_STATE.system = data.system;
    }

    if (data.gpu) {
      BACKEND_STATE.gpu = data.gpu;
    }

    console.log(BACKEND_STATE);
  });
}

function resetReconnectTimer() {
  if (BACKEND_STATE.reconnectTimer) {
    clearInterval(BACKEND_STATE.reconnectTimer);
    BACKEND_STATE.reconnectTimer = null;
  }
  BACKEND_STATE.reconnectTimeLeft = 0;
}

function startReconnectTimer() {
  if (BACKEND_STATE.reconnectTimer) {
    clearInterval(BACKEND_STATE.reconnectTimer);
  }

  BACKEND_STATE.reconnectTimeLeft = RECONNECT_INTERVAL / 1000;

  BACKEND_STATE.reconnectTimer = setInterval(() => {
    BACKEND_STATE.reconnectTimeLeft--;
    if (BACKEND_STATE.reconnectTimeLeft <= 0) {
      clearInterval(BACKEND_STATE.reconnectTimer);
      BACKEND_STATE.reconnectTimer = null;
      console.log('[WS] Attempting reconnect...');
      createSocket();
    }
  }, 1000);
}

// Initial connection
createSocket();