# PUBLIC ROUTES GUIDE

Generated: 2025-10-30 17:30 UTC

This document lists the public-facing FastAPI routes with low-level examples.

---

## Module: `routes.py`

**Router prefix:** `/admin`

### `POST /admin/register`

- **Function:** `admin_register`
- **Request body schema (inferred):** `RegisterBody`
- **Auth:** Unknown (check dependencies)
- **Description:** No docstring provided.

#### Example Request JSON

```json
{
  "<field>": "<value>"
}
```

#### Example Response JSON

```json
{
  "status": "ok",
  "id": "abcd1234"
}
```

---

### `POST /admin/login`

- **Function:** `admin_login`
- **Request body schema (inferred):** `Request`
- **Auth:** Unknown (check dependencies)
- **Description:** No docstring provided.

#### Example Request JSON

```json
{
  "<field>": "<value>"
}
```

#### Example Response JSON

```json
{
  "id": "resource_id"
}
```

---

## Module: `resource_routes.py`

**Router prefix:** `/resources`

### `GET /resources`

- **Function:** `route_get_resources`
- **Request body schema (inferred):** `None`
- **Auth:** Unknown (check dependencies)
- **Description:** Retrieve all active resources.

  Returns all resources where "removed" is False.

#### Example Response JSON

```json
{
  "resources": []
}
```

---

### `POST /resources`

- **Function:** `route_create_resource`
- **Request body schema (inferred):** `Resource`
- **Auth:** Unknown (check dependencies)
- **Description:** Create a new resource and add it to database.

  Returns the dict for the resource.

#### Example Request JSON

```json
{
  "title": "Useful guide",
  "description": "A resource",
  "url": "https://example.com",
  "category": "education"
}
```

#### Example Response JSON

```json
{
  "id": "resource_id"
}
```

---

### `PATCH /resources/{resource_id}`

- **Function:** `route_set_removed`
- **Request body schema (inferred):** `str`
- **Auth:** Unknown (check dependencies)
- **Description:** Set a given resource's field "removed" to True.
  Returns the resource's id.

#### Example Request JSON

```json
{
  "<field>": "<value>"
}
```

---

## Module: `util_routes.py`

**Router prefix:** `/`

### `GET /sync_resources`

- **Function:** `sync_resources`
- **Request body schema (inferred):** `None`
- **Auth:** Unknown (check dependencies)
- **Description:** Fetches resource data from the Google Sheet, parses it,
  and returns a structured summary with the synced resources.

#### Example Response JSON

```json
{
  "status": "success",
  "source": "google_sheet",
  "synced_at": "2025-10-27T12:00:00Z",
  "count": 3,
  "resources": [
    {
      "title": "A",
      "url": "https://a",
      "category": "x"
    },
    {
      "title": "B",
      "url": "https://b",
      "category": "y"
    }
  ]
}
```

---
