import os
import smtplib

from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from dotenv import load_dotenv


# =========================
# Load Environment
# =========================

load_dotenv()


MAIL_USERNAME = os.getenv("MAIL_USERNAME")
MAIL_PASSWORD = os.getenv("MAIL_PASSWORD")
MAIL_FROM = os.getenv(
    "MAIL_FROM",
    MAIL_USERNAME
)


# =========================
# Send OTP Email
# =========================

def send_otp_email(
    recipient_email: str,
    otp: str
):

    if not MAIL_USERNAME:
        raise RuntimeError(
            "MAIL_USERNAME belum diatur"
        )

    if not MAIL_PASSWORD:
        raise RuntimeError(
            "MAIL_PASSWORD belum diatur"
        )

    # =========================
    # Buat Email
    # =========================

    message = MIMEMultipart()

    message["From"] = MAIL_FROM
    message["To"] = recipient_email
    message["Subject"] = "Kode OTP LettuceCare"

    body = f"""
Halo,

Kami menerima permintaan untuk mengatur ulang
password akun LettuceCare Anda.

Kode OTP Anda:

{otp}

Kode OTP ini berlaku selama 10 menit.

Jika Anda tidak meminta pengaturan ulang password,
abaikan email ini.

Jangan berikan kode OTP kepada orang lain.

Salam,
LettuceCare
"""

    message.attach(
        MIMEText(body, "plain")
    )

    # =========================
    # Gmail SMTP SSL
    # =========================

    with smtplib.SMTP_SSL(
        "smtp.gmail.com",
        465,
        timeout=20
    ) as server:

        server.login(
            MAIL_USERNAME,
            MAIL_PASSWORD
        )

        server.sendmail(
            MAIL_FROM,
            recipient_email,
            message.as_string()
        )