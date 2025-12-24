from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Creative Marketing Strategy Engine"
    API_V1_STR: str = "/api/v1"
    
    # Database
    DATABASE_URL: str = "postgresql://user:password@localhost/dbname" # Default for now to allow startup
    
    # AI Providers
    GEMINI_API_KEY: str = ""
    PERPLEXITY_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    
    # Storage
    MINIO_ENDPOINT: str = ""
    MINIO_ACCESS_KEY: str = ""
    MINIO_SECRET_KEY: str = ""

    model_config = SettingsConfigDict(env_file=".env", env_ignore_empty=True, extra="ignore")

settings = Settings()
