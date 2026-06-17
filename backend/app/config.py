from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str
    DIRECT_URL: str = ""
    REDIS_URL: str = ""
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:5173"

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",")]

    model_config = {"env_file": (".env", "../.env"), "extra": "ignore"}


settings = Settings()
