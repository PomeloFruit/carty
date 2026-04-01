from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    openrouter_api_key: str
    openrouter_model: str = "meta-llama/llama-4-scout:free"
    openrouter_base_url: str = "https://openrouter.ai/api/v1"
    catalog_path: str = "catalog/products.json"
    embed_model: str = "all-MiniLM-L6-v2"
    max_search_results: int = 6
    cors_origins: list[str] = ["http://localhost:3000"]
    max_message_length: int = 2000
    max_image_bytes: int = 5_242_880  # 5MB

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
