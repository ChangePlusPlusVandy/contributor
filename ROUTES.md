# API Routes Guide

## Admin Routes (/admin/*)

### Authentication

#### POST `/admin/register`
Registers a new admin account, only allowing emails ending with @thecontributor.org

- Auth: None (for testing purposes. I don't think this will be used later)

- Body:
    "email": "admin@thecontributor.org",
    "password": "123456",
    "name": "Admin Name"

- Notes:
    email must end in @thecontributor.org
    Password must be at least 6 characters

---

#### POST `/admin/login`
Login as admin with email and password. Returns JWT tokens.

- Auth: None

- Body:
    "email": "admin@thecontributor.org",
    "password": "password123"

- Response:
    "access_token": "jwt_token",
    "refresh_token": "refresh_token",
    "admin": {
        "id": "supabase_id",
        "email": "admin@thecontributor.org",
        "name": "Admin Name",
        "role": "admin"
    }

- Notes:
    email must end in @thecontributor.org

---

#### GET `/admin/me`
Get current admin's profile.

- Auth: JWT Bearer token

- Response:
    "admin": { data }

---

#### GET `/admin/users/{user_id}`
Get admin by their Supabase ID.

- Auth: JWT Bearer token

- Response:
    "admin": { data }

---

### Vendor Management

#### POST `/admin/vendors`
Create a new vendor.

- Auth: JWT Bearer token

- Body:
    "vendor_id": "0001",
    "name": "John D."

- Response:
    "message": "Vendor created successfully",
    "vendor": { "vendor_id": "0001", "name": "John D." }

- Notes:
    vendor_id must be exactly 4 digits
    Created vendors have a blank password, when logging in for first time

---

#### POST `/admin/vendors/bulk`
Create multiple vendors at once. Added this to add excel file of vendors

- Auth: JWT Bearer token

- Body:
    [
        { "vendor_id": "0001", "name": "John D." },
        { "vendor_id": "0002", "name": "Jane S." }
    ]

- Response:
    "message": "Created 2 vendors",
    "count": 2

- Notes:
    Checks for duplicate vendor_ids in request
    Checks for already existing vendor_ids in database

---

#### GET `/admin/vendors`
Get all vendors.

- Auth: JWT Bearer token

- Response:
    "vendors": [...],
    "count": 100

---

#### GET `/admin/vendors/{vendor_id}`
Get a specific vendor by their Vendor ID.

- Auth: JWT Bearer token

- Response:
    "vendor": { ... }

---

#### DELETE `/admin/vendors/{vendor_id}`
Delete a vendor. Removes from both MongoDB and Supabase.

- Auth: JWT Bearer token

- Response:
    "message": "Vendor deleted successfully"

---

## Vendor Routes (/auth/*)

### Authentication

#### POST `/auth/login`
Vendor login with Vendor ID and password.

- Auth: None

- Body:
    "vendor_id": "0001",
    "password": "password123"

- Response (if password is set):
    "access_token": "jwt_token",
    "refresh_token": "refresh_token",
    "user": {
        "id": "supabase_id",
        "vendor_id": "0001",
        "name": "John D.",
        "role": "vendor"
    }

- Response (if password not set and blank password sent):
    "password_required": true,
    "message": "Please set your password",
    "name": "John D."

- Notes:
    For first time login, logging in wiht blank password sets password_required: true
    Use this flag to redirect to set password page

---

#### POST `/auth/set-password`
Set password for first-time vendor login. Creates Supabase account and auto-logs in.

- Auth: None

- Body:
    "vendor_id": "0001",
    "password": "newpassword123"

- Response:
    "message": "Password set successfully",
    "access_token": "jwt_token",
    "refresh_token": "refresh_token",
    "user": {
        "id": "supabase_id",
        "vendor_id": "0001",
        "name": "John D.",
        "role": "vendor"
    }

- Notes:
    Creates Supabase account with internal email (v0001@internal.contributor)
    Password must be at least 6 characters
    Automatically logs in after setting password

---

#### GET `/auth/me`
Get current vendor's profile.

- Auth: JWT Bearer token

- Response:
    "user": { ... }

---

#### GET `/auth/users/{vendor_id}`
Get a specific vendor by their Vendor ID.

- Auth: JWT Bearer token (must be logged in as a vendor)

- Response:
    "user": {
        "vendor_id": "0001",
        "name": "John D.",
        "role": "vendor"
    }

---

#### GET `/auth/users`
Get all vendors.

- Auth: JWT Bearer token (must be logged in as a vendor)

- Response:
    "users": [...]

---

### Admin Flow
1. Register: /admin/register
2. Login: /admin/login  Returns token
3. Use access_token as Bearer token for protected routes

### Vendor Flow
1. Admin pre-creates vendor: /admin/vendors
2. Vendor first login: /auth/login with blank password sets password_required: true, redirect to /set-password
3. Set password: POST /auth/set-password   Returns token
4. Login after setup: /auth/login with password   Return token

---

## Error Codes

| Code | Meaning |
|------|---------|
| 400 | Bad request (validation error, duplicate ID) |
| 401 | Invalid credentials |
| 403 | Unauthorized (wrong email domain, missing token) |
| 404 | Not found |
| 422 | Validation error (missing/invalid fields) |
| 500 | Internal server error |