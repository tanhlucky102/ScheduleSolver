import csv
from pathlib import Path
from typing import Literal
from ..timetable.models import Model, State, Room, Reservation, Slot, Session
from ..timetable.rules import room_errors, overlap


def apply(state, action, data, p):
    if action == "rooms-preset":
        default_avail = [
            Slot(day=d, start=420, end=1080, evening=False) for d in range(2, 8)
        ]
        csv_path = Path(__file__).resolve().parents[3] / "resources" / "so_phong.csv"
        preset_rooms = []
        if csv_path.exists():
            with open(csv_path, encoding="utf-8-sig") as f:
                for row in csv.DictReader(f):
                    ten = (row.get("ten_phong") or row.get("id") or "").strip()
                    if not ten:
                        continue
                    tinh_chat = (row.get("tinh_chat_phong") or row.get("room_type") or "").strip()
                    cap_str = (row.get("suc_chua") or "").strip()
                    if "máy tính" in tinh_chat and "máy chiếu" in tinh_chat:
                        rtype = "COMPUTER"
                        equip = ["COMPUTER", "PROJECTOR"]
                        cap = int(cap_str) if cap_str else 100
                        note = f"Phòng {ten} đa năng (máy tính & máy chiếu)"
                    elif "máy tính" in tinh_chat or tinh_chat == "COMPUTER":
                        rtype = "COMPUTER"
                        equip = ["COMPUTER", "PROJECTOR"]
                        cap = int(cap_str) if cap_str else 45
                        note = f"Phòng máy tính {ten} phục vụ TUT"
                    else:
                        rtype = "PROJECTOR"
                        equip = ["PROJECTOR"]
                        cap = int(cap_str) if cap_str else 150
                        note = f"Phòng máy chiếu {ten} phục vụ LEC"
                    preset_rooms.append(Room(
                        id=ten, name=f"Phòng {ten}", capacity=cap,
                        room_type=rtype, equipment=equip,
                        availability=default_avail, active=True,
                        allowed_departments=[], allowed_programs=[], allowed_courses=[], note=note
                    ))
        if not preset_rooms:
            lec_200 = {"101C", "802C"}
            lec_150 = {"405E", "801C", "901C"}
            for r_id in ["101C", "405E", "409D2", "621C", "702C", "801C", "802C", "805C", "901C", "902C"]:
                cap = 200 if r_id in lec_200 else (150 if r_id in lec_150 else 100)
                preset_rooms.append(Room(
                    id=r_id, name=f"Phòng {r_id}", capacity=cap,
                    room_type="PROJECTOR", equipment=["PROJECTOR"],
                    availability=default_avail, active=True,
                    allowed_departments=[], allowed_programs=[], allowed_courses=[], note=f"Phòng máy chiếu {r_id} phục vụ LEC"
                ))
            preset_rooms.append(Room(
                id="206A1", name="Phòng 206A1", capacity=100,
                room_type="COMPUTER", equipment=["COMPUTER", "PROJECTOR"],
                availability=default_avail, active=True,
                allowed_departments=[], allowed_programs=[], allowed_courses=[], note="Phòng 206A1 đa năng (máy tính & máy chiếu)"
            ))
            for r_id in ["201A1", "203E", "205D1", "206D1", "207D1", "303E", "304E", "402C", "404C", "414C", "416C", "417C", "714C", "810C"]:
                preset_rooms.append(Room(
                    id=r_id, name=f"Phòng {r_id}", capacity=45,
                    room_type="COMPUTER", equipment=["COMPUTER", "PROJECTOR"],
                    availability=default_avail, active=True,
                    allowed_departments=[], allowed_programs=[], allowed_courses=[], note=f"Phòng máy tính {r_id} phục vụ TUT"
                ))
        state.rooms = preset_rooms
    elif action in ("rooms", "rooms-delete"):
        if action == "rooms-delete":
            delete_ids = set(data.get("ids", []))
            rooms = [r for r in state.rooms if r.id not in delete_ids]
        else:
            rooms = [Room.model_validate(r) for r in data["rooms"]]
        valid_room_ids = {r.id for r in rooms}
        candidate = State.model_validate(dict(state.model_dump(), rooms=[r.model_dump() for r in rooms]))
        indexed = {r.id: r for r in rooms}
        for event in state.published:
            if not event.get("room_id"):
                continue
            room = indexed.get(event["room_id"])
            if room is None or room_errors(candidate, Session.model_validate({k:v for k,v in event.items() if k in Session.model_fields}), room, event):
                raise ValueError("Room change would invalidate published occupancy: " + event["id"])
        state.reservations = [res for res in state.reservations if res.room_id in valid_room_ids]
        state.rooms = rooms
    elif action == "published-room":
        class PublishedRoom(Model):
            session: str
            room_id: str
        item = PublishedRoom.model_validate(data)
        event = next(r for r in state.published if r["id"] == item.session)
        if event.get("room_id"):
            raise ValueError("Published room is already confirmed")
        room = next(r for r in state.rooms if r.id == item.room_id)
        original = Session.model_validate({k:v for k,v in event.items() if k in Session.model_fields})
        errors = room_errors(state, original, room, event)
        if errors:
            raise ValueError("; ".join(errors))
        event["room_id"] = room.id
    elif action == "reservation":
        item = Reservation.model_validate(data)
        if item.room_id not in {r.id for r in state.rooms}:
            raise ValueError("Unknown reserved room")
        if any(r.get("room_id") == item.room_id and overlap(r, item.model_dump()) for r in state.published):
            raise ValueError("Reservation conflicts with published occupancy")
        if any(r.id == item.id for r in state.reservations):
            raise ValueError("Reservation already exists; release explicitly before changing")
        state.reservations.append(item)
    elif action == "reservation-delete":
        item = next(r for r in state.reservations if r.id == data["id"])
        state.reservations.remove(item)
    elif action == "requirements":
        session = next(s for s in state.sessions if s.id == data["session"])
        class Requirements(Model):
            session: str
            required_equipment: list[str]
            room: Literal["PROJECTOR", "COMPUTER"] | None = None
            required_room_type: str | None = None
        item = Requirements.model_validate(data)
        if item.room is not None:
            session.room = item.room
        session.required_equipment = item.required_equipment
        session.required_room_type = item.required_room_type
    return {}
