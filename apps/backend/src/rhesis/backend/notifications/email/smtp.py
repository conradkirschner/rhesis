"""
SMTP service for sending emails via SendGrid or other SMTP providers.
"""

import os
import smtplib
import socket
import ssl
from email.mime.multipart import MIMEMultipart

from rhesis.backend.logging.rhesis_logger import logger


def _bool_env(name: str, default: bool = False) -> bool:
    val = os.getenv(name)
    if val is None:
        return default
    return val.strip().lower() in ("1", "true", "yes", "on")


def _has_profile(name: str) -> bool:
    """
    Check if a docker compose profile is active.
    Supports comma-separated COMPOSE_PROFILES values.
    """
    profiles = os.getenv("COMPOSE_PROFILES", "")
    return any(p.strip().lower() == name.lower() for p in profiles.split(",") if p.strip())


class SMTPService:
    """Service for sending emails via SMTP (SendGrid or local dev server)."""

    def __init__(self):
        # Core settings
        self.smtp_host = os.getenv("SMTP_HOST")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_user = os.getenv("SMTP_USER")
        self.smtp_password = os.getenv("SMTP_PASSWORD")
        self.from_email = os.getenv("FROM_EMAIL", "engineering@rhesis.ai")

        # TLS/SSL toggles (default off to support MailHog/Mailpit in local dev)
        self.smtp_use_tls = _bool_env("SMTP_USE_TLS", False)  # STARTTLS
        self.smtp_use_ssl = _bool_env("SMTP_USE_SSL", False)  # SMTPS (implicit TLS)
        self.timeout = int(os.getenv("SMTP_TIMEOUT", "30"))

        # Profile-aware behavior: in local-email mode we allow host-only config
        self.local_email = _has_profile("local-email")
        if self.local_email:
            logger.warning("SMTP configuration is set to local development - check mailhog.")

        # Compute configuration completeness
        # - local-email: only host is required (MailHog/Mailpit may not use auth/TLS)
        # - default/production: require host + user + password
        self.is_configured = (
            bool(self.smtp_host)
            if self.local_email
            else all([self.smtp_host, self.smtp_user, self.smtp_password])
        )

        if not self.is_configured:
            logger.warning("SMTP configuration incomplete. Email notifications will be disabled.")
            logger.warning(
                "Missing SMTP config - HOST: %s, USER: %s, PASSWORD: %s",
                bool(self.smtp_host),
                bool(self.smtp_user),
                bool(self.smtp_password),
            )

    def send_message(self, msg: MIMEMultipart, recipient_email: str, task_id: str) -> bool:
        """
        Send the email message with proper SSL/TLS handling and timeout.

        Args:
            msg: The email message to send
            recipient_email: Email address for logging
            task_id: Task ID for logging

        Returns:
            bool: True if email was sent successfully, False otherwise
        """
        if not self.is_configured:
            logger.warning("Cannot send email to %s: SMTP not configured", recipient_email)
            return False

        # Ensure a From header exists
        if not msg.get("From"):
            msg["From"] = self.from_email

        logger.info("Connecting to SMTP server %s:%s", self.smtp_host, self.smtp_port)

        # Set socket timeout to prevent hanging
        socket.setdefaulttimeout(self.timeout)

        try:
            # Choose connection method:
            # - If port is 465 or SMTP_USE_SSL=1 -> implicit TLS
            # - Else plain SMTP; optionally upgrade with STARTTLS if SMTP_USE_TLS=1 and supported
            if self.smtp_port == 465 or self.smtp_use_ssl:
                context = ssl.create_default_context()
                with smtplib.SMTP_SSL(self.smtp_host, self.smtp_port, timeout=self.timeout, context=context) as server:
                    server.set_debuglevel(0)
                    server.ehlo()
                    self._maybe_login(server)
                    server.send_message(msg)
            else:
                with smtplib.SMTP(self.smtp_host, self.smtp_port, timeout=self.timeout) as server:
                    server.set_debuglevel(0)
                    server.ehlo()

                    if self.smtp_use_tls:
                        # Only attempt STARTTLS when advertised
                        if server.has_extn("starttls"):
                            context = ssl.create_default_context()
                            server.starttls(context=context)
                            server.ehlo()
                        else:
                            logger.warning(
                                "STARTTLS requested (SMTP_USE_TLS=1) but not supported by server; continuing without TLS."
                            )

                    self._maybe_login(server)
                    server.send_message(msg)

            logger.info("Email sent successfully to %s for task %s", recipient_email, task_id)
            return True

        except smtplib.SMTPAuthenticationError as e:
            logger.error("SMTP Authentication failed: %s", str(e))
            logger.error("Please check your SMTP username and password")
            return False
        except smtplib.SMTPConnectError as e:
            logger.error("SMTP Connection failed: %s", str(e))
            logger.error("Could not connect to %s:%s", self.smtp_host, self.smtp_port)
            return False
        except smtplib.SMTPServerDisconnected as e:
            logger.error("SMTP Server disconnected: %s", str(e))
            return False
        except smtplib.SMTPDataError as e:
            error_code, error_message = e.args
            # Preserve helpful hint for SendGrid users
            if error_code == 550 and b"does not match a verified Sender Identity" in error_message:
                logger.error("SendGrid Sender Identity Error: %s", str(e))
                logger.error("The from address '%s' is not verified in SendGrid", self.from_email)
                logger.error("Please verify the sender identity in SendGrid Dashboard:")
                logger.error("1. Go to Settings → Sender Authentication")
                logger.error("2. Click 'Verify a Single Sender'")
                logger.error("3. Add and verify '%s'", self.from_email)
                logger.error("4. Complete the email verification process")
            else:
                logger.error("SMTP Data Error: %s", str(e))
            return False
        except socket.timeout:
            logger.error("SMTP connection timed out after %s seconds", self.timeout)
            logger.error("Check if %s:%s is accessible from your network", self.smtp_host, self.smtp_port)
            return False
        except Exception as e:
            logger.error("Unexpected SMTP error: %s", str(e))
            logger.error("Error type: %s", type(e).__name__)
            import traceback

            logger.error("Traceback: %s", traceback.format_exc())
            return False
        finally:
            # Reset socket timeout
            socket.setdefaulttimeout(None)

    def _maybe_login(self, server: smtplib.SMTP) -> None:
        """
        Attempt SMTP AUTH if credentials are present.
        In local-email profile we tolerate missing/failed auth to support MailHog/Mailpit setups.
        """
        if self.smtp_user and self.smtp_password:
            try:
                server.login(self.smtp_user, self.smtp_password)
            except smtplib.SMTPException as e:
                if self.local_email:
                    logger.warning("SMTP auth failed in local-email profile: %s (continuing without auth)", e)
                else:
                    # Re-raise in non-local environments
                    raise
        else:
            if not self.local_email:
                logger.warning("SMTP credentials are missing outside local-email profile.")
