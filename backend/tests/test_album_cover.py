"""
Focused checks for the redesign-v2 PR 7 album metadata / cover-selection work.

There is no pytest in `backend/.venv` yet, so this is written to run standalone:

    cd backend && ./.venv/bin/python tests/test_album_cover.py

It builds a throwaway SQLite file with the *pre*-PR-7 `albums` schema in a
temp dir, points `DATABASE_URL` at it, and never touches the real database.

Covers:
  * migration adds the four new columns exactly once and is idempotent
  * existing rows survive the migration byte-identically, new columns NULL
  * deterministic auto-resolved cover
  * set / re-set (idempotent) / reset-to-automatic
  * unknown album id and unknown photo id are rejected
  * a photo outside the album's folder tree is rejected (containment check)
  * a photo in an `excluded` (hidden) subfolder is rejected
  * a photo in a visible nested subfolder is still accepted
  * partial metadata update leaves untouched fields alone
"""
from __future__ import annotations

import os
import pathlib
import sqlite3
import sys
import tempfile
from datetime import datetime

BACKEND_DIR = pathlib.Path(__file__).resolve().parent.parent

LEGACY_SCHEMA = """
CREATE TABLE albums (
    id VARCHAR NOT NULL PRIMARY KEY,
    name VARCHAR NOT NULL,
    parent_id VARCHAR,
    cover_photo_id VARCHAR,
    photo_count INTEGER,
    child_count INTEGER,
    drive_modified_time DATETIME,
    last_synced DATETIME,
    created_at DATETIME NOT NULL,
    excluded BOOLEAN NOT NULL,
    section VARCHAR
);
CREATE TABLE photos (
    id VARCHAR NOT NULL PRIMARY KEY,
    name VARCHAR NOT NULL,
    mime_type VARCHAR NOT NULL,
    parent_folder_id VARCHAR,
    created_time DATETIME,
    modified_time DATETIME,
    size INTEGER,
    width INTEGER,
    height INTEGER,
    web_view_link VARCHAR,
    cached_at DATETIME NOT NULL
);
INSERT INTO albums VALUES
  ('alb-parent','Travel',NULL,NULL,0,1,NULL,NULL,'2024-01-01 00:00:00',0,'travel'),
  ('alb-a','Maine','alb-parent','p1',2,0,NULL,NULL,'2024-01-01 00:00:00',0,'travel'),
  ('alb-b','Unrelated',NULL,NULL,1,0,NULL,NULL,'2024-01-01 00:00:00',0,NULL);
INSERT INTO photos VALUES
  ('p1','a.jpg','image/jpeg','alb-a','2024-05-10 00:00:00',NULL,1,1,1,NULL,'2024-01-01 00:00:00'),
  ('p2','b.jpg','image/jpeg','alb-a','2024-05-09 00:00:00',NULL,1,1,1,NULL,'2024-01-01 00:00:00'),
  ('pX','x.jpg','image/jpeg','alb-b','2024-05-08 00:00:00',NULL,1,1,1,NULL,'2024-01-01 00:00:00');
"""

LEGACY_COLUMNS = (
    "id,name,parent_id,cover_photo_id,photo_count,child_count,"
    "drive_modified_time,last_synced,created_at,excluded,section"
)
NEW_COLUMNS = ("description", "location", "start_date", "end_date")


def main() -> None:
    tmp_db = pathlib.Path(tempfile.mkdtemp()) / "legacy.db"

    con = sqlite3.connect(tmp_db)
    con.executescript(LEGACY_SCHEMA)
    con.commit()
    before = con.execute(f"SELECT {LEGACY_COLUMNS} FROM albums ORDER BY id").fetchall()
    con.close()

    # Must be set before `core.config` is imported.
    os.environ["DATABASE_URL"] = f"sqlite:///{tmp_db}"
    os.chdir(BACKEND_DIR)
    sys.path.insert(0, str(BACKEND_DIR))

    from core.config import settings

    assert str(tmp_db) in settings.database_url, (
        f"refusing to run against {settings.database_url!r} — expected the temp DB"
    )

    from core.database import create_db_and_tables, engine
    from main import _run_schema_migrations

    # Simulate two app startups: the migration must be idempotent.
    for _ in range(2):
        create_db_and_tables()
        _run_schema_migrations()

    con = sqlite3.connect(tmp_db)
    cols = [r[1] for r in con.execute("PRAGMA table_info(albums)")]
    for col in NEW_COLUMNS:
        assert cols.count(col) == 1, f"{col} missing or duplicated: {cols}"
    after = con.execute(f"SELECT {LEGACY_COLUMNS} FROM albums ORDER BY id").fetchall()
    assert before == after, f"existing rows changed:\n{before}\n{after}"
    dirty = con.execute(
        "SELECT count(*) FROM albums WHERE "
        + " OR ".join(f"{c} IS NOT NULL" for c in NEW_COLUMNS)
    ).fetchone()[0]
    assert dirty == 0, "new columns should default to NULL on existing rows"
    con.close()
    print("ok  migration: additive, idempotent, existing rows preserved")

    from sqlmodel import Session

    from models.album import DriveAlbum
    from models.photo import DrivePhoto
    from services import album_service

    with Session(engine) as s:
        detail = album_service.get_album_detail(s, "alb-a", set())
        assert detail.album.cover_photo_id == "p1", detail.album.cover_photo_id
        print("ok  deterministic auto-resolved cover")

        first = album_service.set_album_cover(s, "alb-a", "p2")
        again = album_service.set_album_cover(s, "alb-a", "p2")
        assert first.cover_photo_id == again.cover_photo_id == "p2"
        reset = album_service.set_album_cover(s, "alb-a", None)
        assert reset.cover_photo_id == "p1", reset.cover_photo_id
        print("ok  set / idempotent re-set / reset-to-automatic")

        for album_id, photo_id, expected in (
            ("alb-a", "does-not-exist", album_service.PhotoNotFoundError),
            ("does-not-exist", "p1", album_service.AlbumNotFoundError),
            # Photo from an unrelated album — must be refused.
            ("alb-a", "pX", album_service.PhotoNotInAlbumError),
        ):
            try:
                album_service.set_album_cover(s, album_id, photo_id)
            except expected:
                pass
            else:
                raise AssertionError(f"expected {expected.__name__} for {album_id}/{photo_id}")
        print("ok  unknown album / unknown photo / foreign photo rejected")

        now = datetime(2024, 1, 1)
        s.add(DriveAlbum(id="alb-a-sub", name="Photos", parent_id="alb-a", created_at=now))
        s.add(DrivePhoto(id="pn", name="n.jpg", mime_type="image/jpeg",
                         parent_folder_id="alb-a-sub", created_time=now, cached_at=now))
        s.add(DriveAlbum(id="alb-hidden", name="Hidden", parent_id="alb-a",
                         created_at=now, excluded=True))
        s.add(DrivePhoto(id="ph", name="h.jpg", mime_type="image/jpeg",
                         parent_folder_id="alb-hidden", created_time=now, cached_at=now))
        s.commit()

        nested = album_service.set_album_cover(s, "alb-a", "pn")
        assert nested.cover_photo_id == "pn"
        direct = album_service.set_album_cover(s, "alb-a", "p2")
        assert direct.cover_photo_id == "p2"
        try:
            album_service.set_album_cover(s, "alb-a", "ph")
        except album_service.PhotoNotInAlbumError:
            pass
        else:
            raise AssertionError("photo in an excluded subfolder should be rejected")
        print("ok  nested-subfolder photo accepted, excluded-subfolder photo rejected")

        updated = album_service.update_album_metadata(s, "alb-a", location="Bar Harbor, Maine")
        assert updated.location == "Bar Harbor, Maine"
        assert updated.description is None
        updated = album_service.update_album_metadata(s, "alb-a", description="A week by the water")
        assert updated.location == "Bar Harbor, Maine", "omitted field was clobbered"
        assert updated.description == "A week by the water"
        print("ok  partial metadata update leaves omitted fields untouched")

    print("\nall PR 7 album cover/metadata checks passed")


if __name__ == "__main__":
    main()
