from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Creative Marketing Strategy Engine"
    API_V1_STR: str = "/api/v1"

    # CORS — override via env: CORS_ALLOW_ORIGINS=http://localhost:5173,https://yourdomain.com
    CORS_ALLOW_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]

    # Database
    DATABASE_URL: str = "postgresql://user:password@localhost/dbname"  # Override via env
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20

    # AI Providers
    GEMINI_API_KEY: str = ""
    PERPLEXITY_API_KEY: str = ""
    OPENAI_API_KEY: str = ""

    # AI Model names — override via env to swap versions without code changes
    GPT_MODEL: str = "gpt-4o"
    GEMINI_MODEL: str = "gemini-2.0-flash"
    PERPLEXITY_MODEL: str = "sonar"

    # Storage
    MINIO_ENDPOINT: str = ""
    MINIO_ACCESS_KEY: str = ""
    MINIO_SECRET_KEY: str = ""
    MINIO_BUCKET: str = "marketing-artifacts"

    # Timeouts (seconds)
    RESEARCH_TIMEOUT: int = 120
    ANALYSIS_TIMEOUT: int = 90

    model_config = SettingsConfigDict(env_file=".env", env_ignore_empty=True, extra="ignore")


settings = Settings()
