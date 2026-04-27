from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "sqlite:///./intelliplay.db"
    secret_key: str = "changeme-replace-in-production"
    cors_origins: list[str] = ["http://localhost:5173"]
    debug: bool = True

    # API keys — optional so server starts even without them
    gemini_api_key: str = ""
    groq_api_key: str = ""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",   # ignore any extra env vars not declared above
    )


settings = Settings()