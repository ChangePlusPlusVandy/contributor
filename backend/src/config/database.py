# connect to mongodb 
# import os
# from dotenv import load_dotenv
# from motor.motor_asyncio import AsyncIOMotorClient
# load_dotenv()

# mongo_key = os.getenv("MONGODB_URI")

# def connect_mongo():
#     try:
#         client = AsyncIOMotorClient(mongo_key)
#         db = client["resources"]

#         print("MongoDB connected successfully!")
#     except Exception as e:
#         print(f"Error connecting to MongoDB: {e}")

