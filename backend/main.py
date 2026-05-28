import asyncio
import json
import websockets

from metrics.collector import get_sys_metrics


CLIENTS = set()


async def register(ws):
    CLIENTS.add(ws)
    print(f'[WS] Client connected ({len(CLIENTS)})')


async def unregister(ws):
    CLIENTS.remove(ws)
    print(f'[WS] Client disconnected ({len(CLIENTS)})')


async def handler(ws):

    await register(ws)

    try:
        while True:

            payload = {
                "system": get_sys_metrics()
            }

            await ws.send(json.dumps(payload))

            await asyncio.sleep(1)

    except websockets.ConnectionClosed:
        pass

    finally:
        await unregister(ws)


async def main():
    server = await websockets.serve(
        handler,
        "localhost",
        8765
    )

    print('[WS] Running on ws://localhost:8765')

    await server.wait_closed()


if __name__ == '__main__':
    asyncio.run(main())