import io
import os

import pytest
from fastapi.testclient import TestClient
from PIL import Image

from server import app

ADMIN_EMAIL = os.environ["ADMIN_EMAIL"]
ADMIN_PASSWORD = os.environ["ADMIN_PASSWORD"]


@pytest.fixture()
def client():
    with TestClient(app) as c:
        yield c


def _login(client, email=ADMIN_EMAIL, password=ADMIN_PASSWORD):
    return client.post("/api/auth/login", json={"email": email, "password": password})


def _auth_headers(client):
    token = _login(client).json()["token"]
    return {"Authorization": f"Bearer {token}"}


# ---------------- Public endpoints ----------------

def test_root(client):
    r = client.get("/api/")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_content_has_seeded_defaults(client):
    r = client.get("/api/content")
    assert r.status_code == 200
    body = r.json()
    assert len(body["projects"]) == 6
    assert len(body["skills"]) == 6
    assert len(body["testimonials"]) == 4
    assert body["resumeUrl"] == ""


def test_admin_endpoints_require_auth(client):
    # Runs before any login in this test's own client, so no stray cookie is set.
    assert client.get("/api/admin/projects").status_code == 401
    assert client.get("/api/admin/skills").status_code == 401
    assert client.get("/api/admin/testimonials").status_code == 401
    assert client.get("/api/admin/enquiries").status_code == 401
    assert client.get("/api/admin/analytics").status_code == 401


# ---------------- Auth ----------------

def test_login_wrong_password(client):
    r = _login(client, password="not-the-password")
    assert r.status_code == 401


def test_login_success_sets_cookie_and_token(client):
    r = _login(client)
    assert r.status_code == 200
    body = r.json()
    assert body["user"]["email"] == ADMIN_EMAIL
    assert body["user"]["role"] == "admin"
    assert "access_token" in r.cookies


def test_auth_me_with_bearer_token(client):
    headers = _auth_headers(client)
    r = client.get("/api/auth/me", headers=headers)
    assert r.status_code == 200
    assert r.json()["email"] == ADMIN_EMAIL


def test_login_lockout_after_five_failures(client):
    # A made-up email so this never touches the real admin account's lockout state.
    victim = "nobody-lockout-test@example.com"
    for _ in range(5):
        r = client.post("/api/auth/login", json={"email": victim, "password": "wrong"})
        assert r.status_code == 401
    r = client.post("/api/auth/login", json={"email": victim, "password": "wrong"})
    assert r.status_code == 429


# ---------------- Admin CRUD: projects ----------------

def test_project_crud(client):
    headers = _auth_headers(client)
    payload = {
        "title": "Test Project", "cat": "web", "desc": "A project created by the test suite.",
        "tech": ["React"], "order": 99,
    }
    r = client.post("/api/admin/projects", json=payload, headers=headers)
    assert r.status_code == 200
    pid = r.json()["id"]

    r = client.get("/api/admin/projects", headers=headers)
    assert any(p["id"] == pid for p in r.json())

    payload["title"] = "Updated Test Project"
    r = client.put(f"/api/admin/projects/{pid}", json=payload, headers=headers)
    assert r.status_code == 200
    r = client.get("/api/admin/projects", headers=headers)
    assert next(p for p in r.json() if p["id"] == pid)["title"] == "Updated Test Project"

    r = client.delete(f"/api/admin/projects/{pid}", headers=headers)
    assert r.status_code == 200
    r = client.get("/api/admin/projects", headers=headers)
    assert all(p["id"] != pid for p in r.json())

    assert client.put(f"/api/admin/projects/{pid}", json=payload, headers=headers).status_code == 404


def test_skill_and_testimonial_crud(client):
    headers = _auth_headers(client)

    r = client.post("/api/admin/skills", json={"name": "Test Skill", "items": ["X"]}, headers=headers)
    sid = r.json()["id"]
    assert client.delete(f"/api/admin/skills/{sid}", headers=headers).status_code == 200

    r = client.post(
        "/api/admin/testimonials",
        json={"text": "Great work overall, would recommend.", "name": "Tester"},
        headers=headers,
    )
    tid = r.json()["id"]
    assert client.delete(f"/api/admin/testimonials/{tid}", headers=headers).status_code == 200


# ---------------- Contact form ----------------

def test_contact_form_then_rate_limit(client):
    headers = _auth_headers(client)
    payload = {"name": "Visitor", "email": "visitor@example.com", "message": "Hello, this is a test enquiry message."}

    for _ in range(5):
        r = client.post("/api/contact", json=payload)
        assert r.status_code == 200
        assert r.json()["emailed"] is False  # no SMTP configured in the test environment

    r = client.post("/api/contact", json=payload)
    assert r.status_code == 429

    r = client.get("/api/admin/enquiries", headers=headers)
    assert len([e for e in r.json() if e["email"] == "visitor@example.com"]) == 5


# ---------------- Tracking + analytics ----------------

def test_track_rejects_bad_path(client):
    r = client.post("/api/track", json={"path": "no-leading-slash", "sid": "s1"})
    assert r.status_code == 400


def test_track_and_analytics(client):
    r = client.post(
        "/api/track", json={"path": "/", "sid": "session-1", "ref": "https://google.com/search"},
        headers={"User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS) AppleWebKit Safari/604.1"},
    )
    assert r.status_code == 200

    headers = _auth_headers(client)
    r = client.get("/api/admin/analytics", headers=headers)
    assert r.status_code == 200
    body = r.json()
    for key in ("totalViews", "uniqueSessions", "totalEnquiries", "days", "topReferrers", "devices", "browsers"):
        assert key in body
    assert body["totalViews"] >= 1
    assert any(d["name"] == "Mobile" for d in body["devices"])


# ---------------- File uploads ----------------

def _png_bytes() -> bytes:
    img = Image.new("RGB", (50, 50), (10, 20, 30))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def test_image_upload_is_optimized_to_webp(client):
    headers = _auth_headers(client)
    r = client.post(
        "/api/admin/files", headers=headers,
        files={"file": ("photo.png", _png_bytes(), "image/png")},
    )
    assert r.status_code == 200
    url = r.json()["url"]

    r = client.get(url)
    assert r.status_code == 200
    assert r.headers["content-type"] == "image/webp"


def test_resume_missing_by_default(client):
    assert client.get("/api/resume").status_code == 404
