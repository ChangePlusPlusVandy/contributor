import pytest
from fastapi.testclient import TestClient
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from main import app

@pytest.fixture(scope="module")
def client():
    with TestClient(app) as test_client:
        yield test_client

TEST_VENDOR_ID = "T001"
TEST_PASSWORD = "testpass123"


class TestVendorLogin:
    def test_login_missing_vendor_id(self, client):
        response = client.post("/auth/login", json={"password": TEST_PASSWORD})
        assert response.status_code == 422

    def test_login_missing_password(self, client):
        response = client.post("/auth/login", json={"vendor_id": TEST_VENDOR_ID})
        assert response.status_code == 422

    def test_login_vendor_not_found(self, client):
        response = client.post("/auth/login", json={"vendor_id": "ZZZZ", "password": TEST_PASSWORD})
        assert response.status_code == 404

    def test_login_wrong_password(self, client):
        response = client.post("/auth/login", json={"vendor_id": TEST_VENDOR_ID, "password": "wrongpass"})
        assert response.status_code in [401, 404]


class TestChangePassword:
    def test_change_password_no_token(self, client):
        response = client.post("/auth/change-password", json={"password": TEST_PASSWORD})
        assert response.status_code in [401, 403]

    def test_change_password_short_password(self, client):
        response = client.post("/auth/change-password", json={"password": "123"}, headers={"Authorization": "Bearer invalid_token"})
        assert response.status_code == 422

    def test_change_password_invalid_token(self, client):
        response = client.post("/auth/change-password", json={"password": TEST_PASSWORD}, headers={"Authorization": "Bearer invalid_token"})
        assert response.status_code == 401


class TestProtectedRoutes:
    def test_me_without_token(self, client):
        response = client.get("/auth/me")
        assert response.status_code in [401, 403]

    def test_me_invalid_token(self, client):
        response = client.get("/auth/me", headers={"Authorization": "Bearer invalid_token"})
        assert response.status_code == 401

    def test_clock_in_without_token(self, client):
        response = client.post("/auth/clock-in")
        assert response.status_code in [401, 403]

    def test_clock_out_without_token(self, client):
        response = client.post("/auth/clock-out")
        assert response.status_code in [401, 403]

    def test_set_location_without_token(self, client):
        response = client.patch("/auth/location", json={"latitude": 36.1, "longitude": -86.7})
        assert response.status_code in [401, 403]


class TestPublicRoutes:
    def test_get_active_vendors(self, client):
        response = client.get("/vendors/active")
        assert response.status_code == 200
        assert "vendors" in response.json()
