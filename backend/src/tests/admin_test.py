import pytest
from fastapi.testclient import TestClient
import sys
import os
import uuid

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from main import app

@pytest.fixture(scope="module")
def client():
    with TestClient(app) as test_client:
        yield test_client

TEST_PASSWORD = "adminpass123"

def unique_admin_email():
    return f"admin_{uuid.uuid4().hex[:8]}@thecontributor.org"


class TestAdminRegistration:
    def test_register_missing_password(self, client):
        response = client.post("/admin/register", json={"email": unique_admin_email()})
        assert response.status_code == 422

    def test_register_missing_email(self, client):
        response = client.post("/admin/register", json={"password": TEST_PASSWORD})
        assert response.status_code == 422

    def test_register_invalid_email_domain(self, client):
        response = client.post("/admin/register", json={
            "email": f"test_{uuid.uuid4().hex[:8]}@gmail.com",
            "password": TEST_PASSWORD
        })
        assert response.status_code in [401, 403]
        assert "Unauthorized email domain" in response.json()["detail"]

    def test_register_short_password(self, client):
        response = client.post("/admin/register", json={
            "email": unique_admin_email(),
            "password": "123"
        })
        assert response.status_code in [400, 422]


class TestAdminLogin:
    def test_login_missing_fields(self, client):
        response = client.post("/admin/login", json={"email": unique_admin_email()})
        assert response.status_code == 422

    def test_login_invalid_domain(self, client):
        response = client.post("/admin/login", json={
            "email": "test@gmail.com",
            "password": TEST_PASSWORD
        })
        assert response.status_code in [401, 403]

    def test_login_wrong_password(self, client):
        response = client.post("/admin/login", json={
            "email": unique_admin_email(),
            "password": "wrongpass"
        })
        assert response.status_code == 401


class TestAdminProtectedRoutes:
    def test_me_without_token(self, client):
        response = client.get("/admin/me")
        assert response.status_code in [401, 403]

    def test_me_invalid_token(self, client):
        response = client.get("/admin/me", headers={"Authorization": "Bearer invalid_token"})
        assert response.status_code == 401

    def test_create_vendor_without_token(self, client):
        response = client.post("/admin/vendors", json={"vendor_id": "T001", "name": "Test"})
        assert response.status_code in [401, 403]

    def test_get_vendors_without_token(self, client):
        response = client.get("/admin/vendors")
        assert response.status_code in [401, 403]

    def test_delete_vendor_without_token(self, client):
        response = client.delete("/admin/vendors/T001")
        assert response.status_code in [401, 403]
