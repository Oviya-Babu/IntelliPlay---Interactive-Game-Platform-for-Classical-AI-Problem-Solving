# from pydantic_settings import BaseSettings, SettingsConfigDict


# class Settings(BaseSettings):
#     database_url: str = "sqlite:///./intelliplay.db"
#     secret_key: str = "changeme-replace-in-production"
#     cors_origins: list[str] = ["http://localhost:5173"]
#     debug: bool = True

#     model_config = SettingsConfigDict(
#         env_file=".env",
#         env_file_encoding="utf-8",
#         case_sensitive=False,
#     )


# settings = Settings()

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "sqlite:///./intelliplay.db"
    secret_key: str = "changeme-replace-in-production"
    cors_origins: list[str] = ["http://localhost:5173"]
    debug: bool = True

    gemini_api_key: str  # 👈 ADD THIS LINE

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )


settings = Settings()