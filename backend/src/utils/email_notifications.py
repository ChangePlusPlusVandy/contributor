from src.config.logger import get_logger

logger = get_logger(__name__)


async def send_submission_status_email(
    to_email: str,
    org_name: str | None,
    status: str,
    extra_message: str | None = None,
) -> None:
    """
    Mock email notification sender - will be replaced with proper API later
    Args:
        to_email (str): Recipient email address
        org_name (str | None): Name of the organization submitting the resource
        status (str): Submission status - "approved", "denied", "needs_more_information", etc.
        extra_message (str | None): Additional message to include in the email
    """
    if status == "approved":
        subject = "Your submission has been approved"
    elif status == "denied":
        subject = "Your submission has been denied"
    elif status == "needs_more_information":
        subject = "We need more information about your submission"
    else:
        subject = f"Update on your resource submission ({status})"

    logger.info(
        "Mock email notification"
        f"To: {to_email}\n"
        f"Org: {org_name or 'Unknown'}\n"
        f"Subject: {subject}\n"
        f"Status: {status}\n"
        f"Extra message: {extra_message or '(none)'}\n"
    )
