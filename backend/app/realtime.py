import asyncio
import logging
from dataclasses import dataclass, field

from fastapi import WebSocket
from starlette.websockets import WebSocketDisconnect

logger = logging.getLogger(__name__)


@dataclass(eq=False)
class Connection:
    socket: WebSocket
    workspace_id: str
    teacher: str | None
    send_lock: asyncio.Lock = field(default_factory=asyncio.Lock)


class RealtimeHub:
    def __init__(self):
        self._connections: dict[str, set[Connection]] = {}

    async def connect(self, socket: WebSocket, principal):
        connection = Connection(
            socket=socket,
            workspace_id=principal.workspace_id,
            teacher=principal.teacher,
        )
        self._connections.setdefault(connection.workspace_id, set()).add(connection)
        await self._send_presence(connection.workspace_id)
        return connection

    async def disconnect(self, connection: Connection):
        clients = self._connections.get(connection.workspace_id)
        if clients is None or connection not in clients:
            return
        clients.remove(connection)
        if not clients:
            self._connections.pop(connection.workspace_id, None)
        await self._send_presence(connection.workspace_id)

    async def broadcast(self, workspace_id: str, message: dict):
        clients = list(self._connections.get(str(workspace_id), ()))
        if not clients:
            return
        await asyncio.gather(*(self._send(client, message) for client in clients))

    async def _send_presence(self, workspace_id: str):
        teachers = sorted({
            client.teacher
            for client in self._connections.get(workspace_id, ())
            if client.teacher
        })
        await self.broadcast(workspace_id, {
            "type": "presence:online",
            "teachers": teachers,
        })

    async def _send(self, connection: Connection, message: dict):
        try:
            async with connection.send_lock:
                await connection.socket.send_json(message)
        except (WebSocketDisconnect, RuntimeError, OSError):
            logger.info("Removing disconnected realtime client")
            await self.disconnect(connection)


hub = RealtimeHub()
