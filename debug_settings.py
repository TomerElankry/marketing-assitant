from app.core.config import settings
import os

print(f"Current Working Directory: {os.getcwd()}")
print(f"Env file exists: {os.path.exists('.env')}")
print(f"GEMINI_API_KEY from settings: '{settings.GEMINI_API_KEY}'") 
print(f"GEMINI_API_KEY length: {len(settings.GEMINI_API_KEY)}")
