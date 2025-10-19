# MongoDB with PyMongo - Python Guide

**What is MongoDB?** MongoDB is a popular NoSQL database that stores data in flexible JSON-like documents instead of traditional rows and tables. Its schema-less design means you can store different types of data without rigid structure, making it perfect for rapid development and handling varied or evolving data models.

---

## 🚀 Setup

```bash
uv add pymongo
```

## 🔑 Environment Variables

```env
MONGODB_URI=mongodb://localhost:27017
# or for MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
```

```python
from pymongo import MongoClient
from dotenv import load_dotenv
import os

# Loads env variables
load_dotenv()

client = MongoClient(os.getenv("MONGODB_URI"))
db = client.your_database_name
```

---

## 📊 Access Database & Collection

```python
# Access database
db = client.my_database

# Access collection
collection = db.my_collection

# Or use dictionary style
collection = db["my_collection"]
```

---

## ➕ Insert (Create)

```python
# Insert one document
result = collection.insert_one({
    "name": "Alice",
    "age": 30,
    "email": "alice@example.com"
})

inserted_id = result.inserted_id

# Insert many documents
result = collection.insert_many([
    {"name": "Bob", "age": 25},
    {"name": "Charlie", "age": 35},
    {"name": "Diana", "age": 28}
])

inserted_ids = result.inserted_ids
```

---

## 🔍 Find (Read)

```python
# Find one document
user = collection.find_one({"name": "Alice"})

# Find all documents
for doc in collection.find():
    print(doc)

# Find with filter
for doc in collection.find({"age": {"$gt": 25}}):
    print(doc)

# Find with projection (only return specific fields)
user = collection.find_one(
    {"name": "Alice"},
    {"name": 1, "email": 1, "_id": 0}
)

# Find with limit and sort
results = collection.find().limit(10).sort("age", 1)  # 1 = ascending, -1 = descending
```

---

## ✏️ Update

```python
# Update one document
result = collection.update_one(
    {"name": "Alice"},
    {"$set": {"age": 31}}
)

matched_count = result.matched_count
modified_count = result.modified_count

# Update many documents
result = collection.update_many(
    {"age": {"$lt": 30}},
    {"$set": {"status": "young"}}
)

# Replace entire document
result = collection.replace_one(
    {"name": "Alice"},
    {"name": "Alice", "age": 32, "email": "newemail@example.com"}
)

# Update and return document
from pymongo import ReturnDocument

updated_doc = collection.find_one_and_update(
    {"name": "Bob"},
    {"$inc": {"age": 1}},
    return_document=ReturnDocument.AFTER
)
```

---

## 🗑️ Delete

```python
# Delete one document
result = collection.delete_one({"name": "Alice"})
deleted_count = result.deleted_count

# Delete many documents
result = collection.delete_many({"age": {"$lt": 25}})
deleted_count = result.deleted_count

# Find and delete (returns the deleted document)
deleted_doc = collection.find_one_and_delete({"name": "Charlie"})
```

---

## 📈 Count Documents

```python
# Count all documents
total = collection.count_documents({})

# Count with filter
young_users = collection.count_documents({"age": {"$lt": 30}})

# Estimated count (faster but less accurate)
estimated_total = collection.estimated_document_count()
```

---

## 🎯 Common Query Operators

```python
# Greater than / Less than
collection.find({"age": {"$gt": 25}})  # >
collection.find({"age": {"$gte": 25}}) # >=
collection.find({"age": {"$lt": 30}})  # <
collection.find({"age": {"$lte": 30}}) # <=

# Not equal
collection.find({"name": {"$ne": "Alice"}})

# In array
collection.find({"status": {"$in": ["active", "pending"]}})

# Multiple conditions (AND)
collection.find({"age": {"$gt": 25}, "status": "active"})

# OR conditions
collection.find({"$or": [{"age": {"$lt": 25}}, {"age": {"$gt": 60}}]})

# Exists
collection.find({"email": {"$exists": True}})
```

---

## 🔧 Indexes

```python
# Create index
collection.create_index("email")

# Create compound index
collection.create_index([("name", 1), ("age", -1)])

# Create unique index
collection.create_index("email", unique=True)

# List indexes
indexes = collection.list_indexes()
```

---

## 🚪 Close Connection

```python
client.close()
```

---

## 📝 Quick Reference

| Operation | Method |
|-----------|--------|
| Insert one | `collection.insert_one({...})` |
| Insert many | `collection.insert_many([...])` |
| Find one | `collection.find_one({...})` |
| Find all | `collection.find({...})` |
| Update one | `collection.update_one({...}, {"$set": {...}})` |
| Update many | `collection.update_many({...}, {"$set": {...}})` |
| Delete one | `collection.delete_one({...})` |
| Delete many | `collection.delete_many({...})` |
| Count | `collection.count_documents({...})` |

**Common Update Operators:**
- `$set` - Set field value
- `$inc` - Increment value
- `$push` - Add to array
- `$pull` - Remove from array

**Access Results:**
- `result.inserted_id` - ID of inserted document
- `result.inserted_ids` - IDs of multiple inserted documents
- `result.matched_count` - Documents matched by filter
- `result.modified_count` - Documents actually modified
- `result.deleted_count` - Documents deleted

Done! 🎉

