"""
backend/agents/base_agent.py
Abstract base agent for streaming AI steps over WebSocket.
"""
from abc import ABC, abstractmethod
import asyncio
from typing import Any
from fastapi import WebSocket, WebSocketDisconnect

class BaseAgent(ABC):
    def __init__(self):
        self.paused = False
        self.delay_ms = 1200

    @abstractmethod
    def get_best_move(self, state: Any) -> Any:
        pass

    async def _handle_control_messages(self, ws: WebSocket):
        try:
            while True:
                msg = await ws.receive_json()
                msg_type = msg.get("type")
                if msg_type == "pause":
                    self.paused = True
                elif msg_type == "resume":
                    self.paused = False
                elif msg_type == "set_speed":
                    self.delay_ms = msg.get("delay_ms", 1200)
                elif msg_type == "ping":
                    await ws.send_json({"type": "pong"})
        except WebSocketDisconnect:
            pass

    async def stream_steps(self, ws: WebSocket, steps: list[dict[str, Any]], delay_ms: int = 1200):
        self.delay_ms = delay_ms
        control_task = asyncio.create_task(self._handle_control_messages(ws))
        
        try:
            for step in steps:
                while self.paused:
                    await asyncio.sleep(0.1)
                
                await ws.send_json(step)
                await asyncio.sleep(self.delay_ms / 1000.0)
                
        except WebSocketDisconnect:
            pass
        finally:
            control_task.cancel()
