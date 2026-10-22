from pydantic import BaseModel, field_validator
import re


class UserCreate(BaseModel):
    username: str
    email: str
    password: str

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        if len(value) < 8:
            raise ValueError("Password minimal 8 karakter")

        if not re.search(r"[A-Z]", value):
            raise ValueError(
                "Password harus mengandung minimal 1 huruf besar"
            )

        if not re.search(r"[a-z]", value):
            raise ValueError(
                "Password harus mengandung minimal 1 huruf kecil"
            )

        if not re.search(r"\d", value):
            raise ValueError(
                "Password harus mengandung minimal 1 angka"
            )

        if not re.search(r"[^A-Za-z0-9]", value):
            raise ValueError(
                "Password harus mengandung minimal 1 karakter khusus"
            )

        return value


class UserLogin(BaseModel):
    email: str
    password: str