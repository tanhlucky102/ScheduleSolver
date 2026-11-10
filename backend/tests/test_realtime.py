import asyncio
from types import SimpleNamespace

from app.realtime import RealtimeHub


class FakeSocket:
    def __init__(self):
        self.messages=[]

    async def send_json(self,message):
        self.messages.append(message)


def test_presence_counts_multiple_tabs_until_last_disconnect():
    async def run():
        hub=RealtimeHub()
        first_tab=FakeSocket()
        second_tab=FakeSocket()
        observer=FakeSocket()
        account=SimpleNamespace(workspace_id="w",id="u1",teacher="t1")
        monitor=SimpleNamespace(workspace_id="w",id="u2",teacher=None)
        first=await hub.connect(first_tab,account)
        second=await hub.connect(second_tab,account)
        await hub.connect(observer,monitor)

        await hub.disconnect(first)
        assert observer.messages[-1]=={"type":"presence:online","teachers":["t1"]}
        await hub.disconnect(second)
        assert observer.messages[-1]=={"type":"presence:online","teachers":[]}

    asyncio.run(run())
