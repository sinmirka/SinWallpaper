const socket = new WebSocket('ws://localhost:8765');

const BACKEND_STATE = {
  connected: false,
  system: {}
};

socket.addEventListener('open', () => {
  console.log('[WS] Connected');

  BACKEND_STATE.connected = true;
});

socket.addEventListener('close', () => {
  console.log('[WS] Disconnected');

  BACKEND_STATE.connected = false;
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