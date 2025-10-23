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
TEST_VENDOR_PASSWORD = "testpass123"
TEST_VENDOR_NAME = "Test Vendor"
TEST_VENDOR_DOB = "2007-10-14"

# MAKES A UNIQUE EMAIL(so each test can be independent)
def unique_email():
    return f"test_{uuid.uuid4().hex[:8]}@example.com"


class TestVendorSignup:
    """
    SUCCESSFUL SIGNUP
    """
    def test_signup_success(self, client):
        response = client.post("/auth/signup",
            json={
                # all fields valid
                "email": unique_email(),
                "password": TEST_VENDOR_PASSWORD,
                "name": TEST_VENDOR_NAME,
                "dob": TEST_VENDOR_DOB
            }
        )

        assert response.status_code == 201
        data = response.json()
        assert "supabase_id" in data

    """
    UNSUCCESSFUL SIGNUP WITH NO PASSWORD
    """
    def test_signup_missing_password(self, client):
        response = client.post("/auth/signup",
            json={
                "email": unique_email(),
                "name": TEST_VENDOR_NAME,
                "dob": TEST_VENDOR_DOB
                # no password
            }
        )

        assert response.status_code == 422


    """
    UNSUCCESSFUL SIGUP WITH NO EMAIL
    """
    def test_signup_missing_email(self, client):
        response = client.post(
            "/auth/signup",
            json={
                # no email
                "password": TEST_VENDOR_PASSWORD,
                "name": TEST_VENDOR_NAME,
                "dob": TEST_VENDOR_DOB
            }
        )

        assert response.status_code == 422


    """
    UNSUCCESSFUL SIGNUP WITH SHORT PASSWORD (<6 chars)
    """
    def test_signup_short_password(self, client):
        response = client.post("/auth/signup",
            json={
                "email": unique_email(),
                "password": "123",
                "name": TEST_VENDOR_NAME,
                "dob": TEST_VENDOR_DOB
            }
        )

        assert response.status_code == 422



class TestVendorLogin:
    """
    WORKING LOGIN
    """
    def test_login_success(self, client):
        # make user first
        email = unique_email()
        signup_response = client.post("/auth/signup",
            json={
                "email": email,
                "password": TEST_VENDOR_PASSWORD,
                "name": TEST_VENDOR_NAME,
                "dob": TEST_VENDOR_DOB
            }
        )
        print(f"\nSignup response: {signup_response.status_code}")
        print(f"Signup body: {signup_response.json()}")
        assert signup_response.status_code == 201

        # login attempt
        response = client.post(
            "/auth/login",
            json={
                "email": email,
                "password": TEST_VENDOR_PASSWORD
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["user"]["role"] == "vendor"


    """
    LOGIN WITH WRONG PASSWORD
    """
    def test_login_wrong_password(self, client):
        email = unique_email()
        client.post("/auth/signup", json={
            "email": email,
            "password": TEST_VENDOR_PASSWORD,
            "name": TEST_VENDOR_NAME,
            "dob": TEST_VENDOR_DOB
        })

        response = client.post(
            "/auth/login",
            json={
                "email": email,
                "password": "wrongpassword"
            }
        )

        assert response.status_code == 401
        

    """
    LOGIN WITH EMAIL THAT ISNT REGISTERED
    """
    def test_login_nonexistent_email(self, client):
        response = client.post(
            "/auth/login",
            json={
                "email": "doesnotexist@example.com",
                "password": TEST_VENDOR_PASSWORD
            }
        )

        assert response.status_code == 401



class TestProtectedRoutes:
    """
    /me ROUTE WITH NO TOKEN
    """
    def test_get_me_without_token(self, client):
        response = client.get("/auth/me")
        assert response.status_code == 403

    """
    /me ROUTE WITH INVALID TOKEN
    """
    def test_get_me_invalid_token(self, client):
        response = client.get(
            "/auth/me",
            headers={"Authorization": "Bearer invalid_token"}
        )
        assert response.status_code == 401

    """
    /me ROUTE WITH VALID TOKEN
    """
    def test_get_me_with_valid_token(self, client):
        # Signup
        email = unique_email()
        signup_response = client.post(
            "/auth/signup",
            json={
                "email": email,
                "password": TEST_VENDOR_PASSWORD,
                "name": TEST_VENDOR_NAME,
                "dob": TEST_VENDOR_DOB
            }
        )
        assert signup_response.status_code == 201
        
        # Login
        login_response = client.post(
            "/auth/login",
            json={
                "email": email,
                "password": TEST_VENDOR_PASSWORD
            }
        )
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]

        # Access protected route with valid token
        response = client.get(
            "/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )

        assert response.status_code == 200
        data = response.json()
        assert "user" in data
        assert data["user"]["role"] == "vendor"

    """
    /users/{id} ROUTE WITHOUT TOKEN
    """
    def test_get_user_by_id_without_token(self, client):
        response = client.get("/auth/users/some-id")
        assert response.status_code == 403

    """
    /users/{id} ROUTE WITH VALID TOKEN AND VALID USER ID
    """
    def test_get_user_by_id_success(self, client):
        # Create a user to fetch
        email = unique_email()
        signup_response = client.post("/auth/signup", json={
            "email": email,
            "password": TEST_VENDOR_PASSWORD,
            "name": TEST_VENDOR_NAME,
            "dob": TEST_VENDOR_DOB
        })
        assert signup_response.status_code == 201
        user_id = signup_response.json()["supabase_id"]

        # Login to get token
        login_response = client.post("/auth/login", json={
            "email": email,
            "password": TEST_VENDOR_PASSWORD
        })
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]

        # Get user profile by ID
        response = client.get(
            f"/auth/users/{user_id}",
            headers={"Authorization": f"Bearer {token}"}
        )

        assert response.status_code == 200
        data = response.json()
        assert "user" in data
        assert data["user"]["supabase_id"] == user_id
        assert data["user"]["email"] == email
        assert data["user"]["role"] == "vendor"

    """
    /users/{id} ROUTE WITH NONEXISTENT USER ID
    """
    def test_get_user_by_id_not_found(self, client):
        """Test /users/{id} returns 404 for non-existent user"""
        # Create and login a user first to get token
        email = unique_email()
        client.post("/auth/signup", json={
            "email": email,
            "password": TEST_VENDOR_PASSWORD,
            "name": TEST_VENDOR_NAME,
            "dob": TEST_VENDOR_DOB
        })

        login_response = client.post(
            "/auth/login",
            json={
                "email": email,
                "password": TEST_VENDOR_PASSWORD
            }
        )

        if login_response.status_code == 200:
            token = login_response.json()["access_token"]

            response = client.get(
                "/auth/users/nonexistent-id-12345",
                headers={"Authorization": f"Bearer {token}"}
            )

            assert response.status_code == 404


class TestRoleEnforcement:

    """
    CHECKS ASSIGNED ROLE IS VENDOR UPON SIGNUP
    """
    def test_vendor_role_assigned_on_signup(self, client):
        email = unique_email()
        signup_response = client.post(
            "/auth/signup",
            json={
                "email": email,
                "password": TEST_VENDOR_PASSWORD,
                "name": TEST_VENDOR_NAME,
                "dob": TEST_VENDOR_DOB
            }
        )
        assert signup_response.status_code == 201

        login_response = client.post(
            "/auth/login",
            json={
                "email": email,
                "password": TEST_VENDOR_PASSWORD
            }
        )

        assert login_response.status_code == 200
        assert login_response.json()["user"]["role"] == "vendor"