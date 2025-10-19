# Supabase Authentication - Python Guide

**What is Supabase?** Supabase is an open-source Firebase alternative built on PostgreSQL, providing a full backend-as-a-service with database, authentication, storage, and real-time subscriptions. Its standout feature is built-in authentication with JWT tokens and Row Level Security, making it incredibly easy to handle secure user auth without building your own system.

---

## 🚀 Setup

```bash
uv add supabase
```

## 🔑 Environment Variables

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-anon-key
```

```python
from supabase import create_client, Client
from dotenv import load_dotenv
import os

#loads env variables
load_dotenv()

supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)
```

---

## 📧 Sign Up

```python
response = supabase.auth.sign_up({
    "email": "user@example.com",
    "password": "secure-password"
})

access_token = response.session.access_token
refresh_token = response.session.refresh_token
user_id = response.user.id
```

---

## 🔐 Sign In

```python
response = supabase.auth.sign_in_with_password({
    "email": "user@example.com",
    "password": "secure-password"
})

access_token = response.session.access_token
refresh_token = response.session.refresh_token
user_id = response.user.id
user_email = response.user.email
```

---

## 🚪 Sign Out (Invalidates the JWT Token)

```python
supabase.auth.sign_out()
```

---

## 👤 Get Current User

```python
# From stored token
response = supabase.auth.get_user(access_token)
user = response.user

# User properties
user.id
user.email
user.created_at
```

---

## 🔄 Refresh Session

```python
response = supabase.auth.refresh_session()
new_access_token = response.session.access_token
```

---

## 🎯 Verify JWT Token (FastAPI)

```python
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        user = supabase.auth.get_user(token)
        return user.user
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

# Use in routes
@app.get("/protected")
async def protected(current_user = Depends(get_current_user)):
    return {"user_id": current_user.id}
```

---

## 💡 JWT Token Structure

**Access Token** - Use this for API authentication:
```
Authorization: Bearer <access_token>
```

**Refresh Token** - Use to get new access tokens when they expire

---

## 🛠️ Error Handling

```python
try:
    response = supabase.auth.sign_in_with_password({
        "email": email,
        "password": password
    })
except Exception as e:
    print(f"Login failed: {str(e)}")
```

---

## 📝 Quick Reference

| Action | Method |
|--------|--------|
| Sign up | `supabase.auth.sign_up({...})` |
| Sign in | `supabase.auth.sign_in_with_password({...})` |
| Sign out | `supabase.auth.sign_out()` |
| Get user | `supabase.auth.get_user(token)` |
| Refresh | `supabase.auth.refresh_session()` |

**Get tokens from response:**
- `response.session.access_token`
- `response.session.refresh_token`

**Get user info:**
- `response.user.id`
- `response.user.email`

