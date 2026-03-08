from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "PHIL"
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
    GROK_API_KEY: str = ""
    NEWSAPI_KEY: str = ""
    REDDIT_CLIENT_ID: str = ""
    REDDIT_CLIENT_SECRET: str = ""
    REDDIT_USER_AGENT: str = "PHIL/1.0"

    # AI Model names — override via env to swap versions without code changes
    GPT_MODEL: str = "gpt-4o"
    GEMINI_MODEL: str = "gemini-2.0-flash"
    PERPLEXITY_MODEL: str = "sonar"
    GROK_MODEL: str = "grok-2-latest"

    # Storage
    MINIO_ENDPOINT: str = ""
    MINIO_ACCESS_KEY: str = ""
    MINIO_SECRET_KEY: str = ""
    MINIO_BUCKET: str = "marketing-artifacts"

    # Google OAuth
    GOOGLE_CLIENT_ID: str = ""

    # Email (SMTP) — for password reset emails
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    FROM_EMAIL: str = "noreply@phil.app"
    FRONTEND_URL: str = "http://localhost:5173"

    # Auth / JWT
    SECRET_KEY: str = "changeme-generate-a-strong-secret-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 8  # 8 hours

    # Timeouts (seconds)
    RESEARCH_TIMEOUT: int = 120
    ANALYSIS_TIMEOUT: int = 90

    model_config = SettingsConfigDict(env_file=".env", env_ignore_empty=True, extra="ignore")


settings = Settings()
