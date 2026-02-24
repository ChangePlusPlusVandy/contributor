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

def unique_org_name():
    """Generate unique org name for testing"""
    return f"Test_Org_{uuid.uuid4().hex[:8]}"

# Test data
TEST_RESOURCE_NAME = "John Doe"
TEST_RESOURCE_EMAIL = "john@test.com"
TEST_RESOURCE_PHONE = 1234567890
TEST_RESOURCE_ORG_NAME = "Test Organization"


class TestGetResources:
    """
    GET /resources/ ENDPOINT
    """
    
    def test_get_active(self, client):
        """
        SUCCESSFUL RETRIEVAL OF ACTIVE RESOURCES
        """
        response = client.get("/resources/")

        assert response.status_code == 200
        data = response.json()

        assert data["success"] is True
        assert "resources" in data
        assert data["active"] is True
        assert isinstance(data["resources"], list)

    
    def test_get_active_parameter(self, client):
        """
        SUCCESSFUL RETRIEVAL OF ACTIVE RESOURCES (active flag)
        """
        response = client.get("/resources?active=true")

        assert response.status_code == 200
        data = response.json()

        assert data["success"] is True
        assert "resources" in data
        assert data["active"] is True
        assert isinstance(data["resources"], list)

    
    def test_get_all(self, client):
        """
        SUCCESSFUL RETRIEVAL OF ALL RESOURCES
        """
        response = client.get("/resources?active=false")

        assert response.status_code == 200
        data = response.json()

        assert data["success"] is True
        assert "resources" in data
        assert data["active"] is False
    

class TestCreateResource:
    """
    POST /resources/ ENDPOINT
    """

    def test_create_success(self, client):
        """
        SUCCESSFUL CREATION OF NEW RESOURCE
        """
        response = client.post("/resources/",
            json={
                "name": TEST_RESOURCE_NAME,
                "email": TEST_RESOURCE_EMAIL,
                "phone": TEST_RESOURCE_PHONE,
                "org_name": unique_org_name(),
                "add": True,
                "address": "123 Test St",
                "city": "Nashville",
                "state": "TN",
                "zip_code": "37203"
            })
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["resource"]["name"] == TEST_RESOURCE_NAME

    def test_create_missing_fields(self, client):
        """
        UNSUCCESSFUL CREATION OF NEW RESOURCE WITH MISSING FIELDS
        """
        response_no_add = client.post("/resources/",
            json={
                "name": TEST_RESOURCE_NAME,
                "email": TEST_RESOURCE_EMAIL,
                "phone": TEST_RESOURCE_PHONE,
                "org_name": unique_org_name()
            })

        response_no_org = client.post("/resources/",
            json={
                "name": TEST_RESOURCE_NAME,
                "email": TEST_RESOURCE_EMAIL,
                "phone": TEST_RESOURCE_PHONE,
                "add": True
            })

        response_no_phone = client.post("/resources/",
            json={
                "name": TEST_RESOURCE_NAME,
                "email": TEST_RESOURCE_EMAIL,
                "org_name": unique_org_name(),
                "add": True
            })
        
        response_no_email = client.post("/resources/",
            json={
                "name": TEST_RESOURCE_NAME,
                "phone": TEST_RESOURCE_PHONE,
                "org_name": unique_org_name(),
                "add": True
            })
        
        response_no_name = client.post("/resources/",
            json={
                "email": TEST_RESOURCE_EMAIL,
                "phone": TEST_RESOURCE_PHONE,
                "org_name": unique_org_name(),
                "add": True
            })
        
        assert response_no_add.status_code == 422
        assert response_no_org.status_code == 422
        assert response_no_phone.status_code == 422
        assert response_no_email.status_code == 422
        assert response_no_name.status_code == 422
        

class TestGetOneResource:
    """
    GET /resources/{identifier} ENDPOINT
    """

    def test_get_resource_by_id_success(self, client):
        """
        SUCCESSFUL GET RESOURCE BY ID
        """
        # Create resource first
        create_response = client.post("/resources/",
            json={
                "name": TEST_RESOURCE_NAME,
                "email": TEST_RESOURCE_EMAIL,
                "phone": TEST_RESOURCE_PHONE,
                "org_name": unique_org_name(),
                "add": True
            }
        )
        resource_id = create_response.json()["resource"]["_id"]
        
        # Get by ID
        response = client.get(f"/resources/{resource_id}?search_by=id")
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["resource"]["_id"] == resource_id

    def test_get_resource_by_org_name_success(self, client):
        """
        SUCCESSFUL GET RESOURCE BY ORG_NAME
        """
        org_name = unique_org_name()
        
        # Create resource
        client.post("/resources/",
            json={
                "name": TEST_RESOURCE_NAME,
                "email": TEST_RESOURCE_EMAIL,
                "phone": TEST_RESOURCE_PHONE,
                "org_name": org_name,
                "add": True
            }
        )
        
        # Get by org_name
        response = client.get(f"/resources/{org_name}?search_by=org_name")
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["resource"]["org_name"] == org_name

    def test_get_nonexistent_resource(self, client):
        """
        GET RESOURCE THAT DOESN'T EXIST RETURNS NULL
        """
        response_id = client.get("/resources/507f1f77bcf86cd799439011?search_by=id")
        response_name = client.get("/resources/asdfasdf?search_by=org_name")
        
        assert response_id.status_code == 200
        data_id = response_id.json()
        assert data_id["success"] is True
        assert data_id["resource"] is None

        assert response_name.status_code == 200
        data_name = response_id.json()
        assert data_name["success"] is True
        assert data_name["resource"] is None


class TestUpdateResource:
    """
    PATCH /resources/{resource_id} ENDPOINT
    """
    def test_update_resource_success(self, client):
        """
        SUCCESSFUL RESOURCE UPDATE
        """
        # Create resource
        create_response = client.post("/resources/",
            json={
                "name": TEST_RESOURCE_NAME,
                "email": TEST_RESOURCE_EMAIL,
                "phone": TEST_RESOURCE_PHONE,
                "org_name": unique_org_name(),
                "add": True
            }
        )
        resource_id = create_response.json()["resource"]["_id"]
        
        # Update it
        response = client.patch(f"/resources/{resource_id}",
            json={"email": "newemail@example.com", "phone": 33333333333}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["modified_count"] >= 0
    
    def test_update_nonexistent_resource(self, client):
        """
        UPDATE RESOURCE THAT DOESN'T EXIST
        """
        response = client.patch("/resources/507f1f77bcf86cd799439011",
            json={"email": "test@test.com"}
        )
        
        assert response.status_code == 404

# class TestSeedDB:

class TestFormSubmission:
    """
    POST /resources/form ENDPOINT
    """
    def test_receive_form_new_resource(self, client):
        """
        SUCCESSFUL FORM SUBMISSION FOR NEW RESOURCE
        """
        response = client.post("/resources/form",
            json={
                "name": TEST_RESOURCE_NAME,
                "email": TEST_RESOURCE_EMAIL,
                "phone": TEST_RESOURCE_PHONE,
                "org_name": unique_org_name(),
                "add": True
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "resource" in data


class TestApproveSubmission:
    """
    POST /resources/pending/{submission_id}/approve ENDPOINT
    """
    def test_approve_new_submission_success(self, client):
        """
        SUCCESSFUL APPROVAL OF NEW RESOURCE SUBMISSION
        """
        # Submit form
        org_name = unique_org_name()
        form_response = client.post("/resources/form",
            json={
                "name": TEST_RESOURCE_NAME,
                "email": TEST_RESOURCE_EMAIL,
                "phone": TEST_RESOURCE_PHONE,
                "org_name": org_name,
                "add": True
            }
        )
        assert form_response.status_code == 200
        
        # Get submission ID from pending collection
        # (You'll need to query MongoDB directly or have an endpoint to list pending)
        # For now, assuming we have the submission_id
        
        # response = client.post(f"/resources/pending/{submission_id}/approve")
        # assert response.status_code == 200
        # assert response.json()["action"] == "created"
    
    def test_approve_nonexistent_submission(self, client):
        """
        APPROVE SUBMISSION THAT DOESN'T EXIST
        """
        response = client.post("/resources/pending/507f1f77bcf86cd799439011/approve")
        
        assert response.status_code == 404


class TestDenySubmission:
    """
    POST /resources/pending/{submission_id}/deny ENDPOINT
    """
    def test_deny_submission_success(self, client):
        """
        SUCCESSFUL DENIAL OF SUBMISSION
        """
        # Similar to approve test - need submission_id
        pass
    
    def test_deny_nonexistent_submission(self, client):
        """
        DENY SUBMISSION THAT DOESN'T EXIST
        """
        response = client.post("/resources/pending/507f1f77bcf86cd799439011/deny")
        
        assert response.status_code == 404




