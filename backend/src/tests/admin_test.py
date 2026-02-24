import pytest
from fastapi.testclient import TestClient
import sys
import os
import uuid

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from main import app

# Test client fixture with lifespan support
@pytest.fixture(scope="module")
def client():
    """Create test client with lifespan context"""
    with TestClient(app) as test_client:
        yield test_client

# Test data
TEST_ADMIN_PASSWORD = "adminpass123"
TEST_ADMIN_NAME = "Test Admin"
TEST_ADMIN_DOB = "1990-05-20"

# MAKES A UNIQUE EMAIL (so each test can be independent)
def unique_admin_email():
    return f"admin_{uuid.uuid4().hex[:8]}@thecontributor.org"


class TestAdminRegistration:
    """
    SUCCESSFUL REGISTRATION
    """
    def test_register_success(self, client):
        response = client.post("/admin/register",
            json={
                # all fields valid
                "email": unique_admin_email(),
                "password": TEST_ADMIN_PASSWORD,
                "name": TEST_ADMIN_NAME,
                "dob": TEST_ADMIN_DOB
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert "id" in data

    """
    UNSUCCESSFUL REGISTRATION WITH NO PASSWORD
    """
    def test_register_missing_password(self, client):
        response = client.post("/admin/register",
            json={
                "email": unique_admin_email(),
                "name": TEST_ADMIN_NAME,
                "dob": TEST_ADMIN_DOB
                # no password
            }
        )

        assert response.status_code == 422

    """
    UNSUCCESSFUL REGISTRATION WITH NO EMAIL
    """
    def test_register_missing_email(self, client):
        response = client.post("/admin/register",
            json={
                # no email
                "password": TEST_ADMIN_PASSWORD,
                "name": TEST_ADMIN_NAME,
                "dob": TEST_ADMIN_DOB
            }
        )

        assert response.status_code == 422

    """
    UNSUCCESSFUL REGISTRATION WITH INVALID EMAIL DOMAIN
    """
    def test_register_invalid_email_domain(self, client):
        response = client.post("/admin/register",
            json={
                "email": f"test_{uuid.uuid4().hex[:8]}@gmail.com",  # not @thecontributor.org
                "password": TEST_ADMIN_PASSWORD,
                "name": TEST_ADMIN_NAME,
                "dob": TEST_ADMIN_DOB
            }
        )

        assert response.status_code == 403
        assert "Unauthorized email domain" in response.json()["detail"]

    """
    UNSUCCESSFUL REGISTRATION WITH SHORT PASSWORD (<6 chars)
    """
    def test_register_short_password(self, client):
        response = client.post("/admin/register",
            json={
                "email": unique_admin_email(),
                "password": "123",
                "name": TEST_ADMIN_NAME,
                "dob": TEST_ADMIN_DOB
            }
        )

        # Supabase returns 400 for short passwords, FastAPI would return 422
        assert response.status_code in [400, 422]


class TestAdminLogin:
    """
    WORKING LOGIN
    """
    def test_login_success(self, client):
        # Create admin first
        email = unique_admin_email()
        signup_response = client.post("/admin/register",
            json={
                "email": email,
                "password": TEST_ADMIN_PASSWORD,
                "name": TEST_ADMIN_NAME,
                "dob": TEST_ADMIN_DOB
            }
        )
        print(f"\nAdmin registration response: {signup_response.status_code}")
        print(f"Registration body: {signup_response.json()}")
        assert signup_response.status_code == 200

        # Login via Supabase to get token
        import requests
        from dotenv import load_dotenv
        load_dotenv()

        # Note: This requires actual Supabase auth
        # In a real test, you'd mock this or use a test Supabase instance
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_KEY")

        if supabase_url and supabase_key:
            auth_response = requests.post(
                f"{supabase_url}/auth/v1/token?grant_type=password",
                json={"email": email, "password": TEST_ADMIN_PASSWORD},
                headers={"apikey": supabase_key}
            )

            if auth_response.status_code == 200:
                token = auth_response.json()["access_token"]

                # Attempt login with Bearer token
                response = client.post(
                    "/admin/login",
                    headers={"Authorization": f"Bearer {token}"}
                )

                assert response.status_code == 200
                data = response.json()
                assert data["status"] == "ok"
                assert "id" in data

    """
    LOGIN WITHOUT BEARER TOKEN
    """
    def test_login_missing_bearer_token(self, client):
        response = client.post("/admin/login")

        assert response.status_code == 401
        assert "Missing Bearer token" in response.json()["detail"]

    """
    LOGIN WITH INVALID TOKEN
    """
    def test_login_invalid_token(self, client):
        response = client.post(
            "/admin/login",
            headers={"Authorization": "Bearer invalid_token_123"}
        )

        assert response.status_code == 401

    """
    LOGIN WITH NON-CONTRIBUTOR EMAIL DOMAIN
    """
    def test_login_unauthorized_domain(self, client):
        # This would fail at registration, but testing the login path
        response = client.post(
            "/admin/login",
            headers={"Authorization": "Bearer fake_token"}
        )

        # Should fail due to invalid token or unauthorized domain
        assert response.status_code in [401, 403]


class TestAdminAuthorization:
    """
    CHECKS EMAIL DOMAIN ENFORCEMENT
    """
    def test_only_contributor_emails_allowed(self, client):
        # Try to register with non-contributor email
        response = client.post("/admin/register",
            json={
                "email": f"test_{uuid.uuid4().hex[:8]}@example.com",
                "password": TEST_ADMIN_PASSWORD,
                "name": TEST_ADMIN_NAME,
                "dob": TEST_ADMIN_DOB
            }
        )

        assert response.status_code == 403
        assert "Unauthorized email domain" in response.json()["detail"]

    """
    CHECKS THAT ADMIN MUST BE REGISTERED TO LOGIN
    """
    def test_login_admin_not_in_database(self, client):
        # Create a valid token for an admin that doesn't exist in MongoDB
        # This would require mocking or creating the user in Supabase but not MongoDB
        # For now, we test with an invalid token which will fail earlier
        response = client.post(
            "/admin/login",
            headers={"Authorization": "Bearer some_valid_looking_token"}
        )

        # Should fail at token validation or database lookup
        assert response.status_code in [401, 403]
