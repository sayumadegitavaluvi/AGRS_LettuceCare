
import os
import secrets

from dotenv import load_dotenv
from fastapi import HTTPException, Security
from fastapi.security import APIKeyHeader


# Membaca konfigurasi dari file .env
load_dotenv()

# API Key dikirim melalui header X-API-Key
api_key_header = APIKeyHeader(
    name="X-API-Key",
    auto_error=False
)


def verify_knowledge_base_key(
    api_key: str | None = Security(api_key_header)
):
    # Mengambil API Key dari environment
    expected_key = os.getenv("KNOWLEDGE_BASE_API_KEY")

    # Jika konfigurasi belum tersedia
    if not expected_key:
        raise HTTPException(
            status_code=503,
            detail="Konfigurasi API Key belum tersedia"
        )

    # Memeriksa kecocokan API Key
    if not api_key or not secrets.compare_digest(
        api_key, expected_key
    ):
        raise HTTPException(
            status_code=403,
            detail="Akses ditolak. API Key tidak valid"
        )

    return True
