from fastapi import APIRouter, Depends

from app.utils.security import get_current_user


router = APIRouter(
    prefix="/test",
    tags=["Test"]
)


@router.get("/protected")
def protected(
    user: str = Depends(get_current_user)
):
    return {
        "message": "Access granted",
        "user": user
    }