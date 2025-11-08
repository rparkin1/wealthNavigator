"""
Email service for sending transactional emails.
For MVP, we'll log emails to console. In production, integrate with SendGrid/AWS SES.
"""

import logging
from typing import Optional

logger = logging.getLogger(__name__)

class EmailService:
    """Email service for transactional emails."""
    
    def __init__(self, mock_mode: bool = True):
        """
        Initialize email service.
        
        Args:
            mock_mode: If True, log emails instead of sending (for development/testing)
        """
        self.mock_mode = mock_mode
    
    async def send_password_reset_email(
        self,
        email: str,
        reset_token: str,
        reset_url: str
    ) -> bool:
        """
        Send password reset email.
        
        Args:
            email: Recipient email address
            reset_token: Password reset token
            reset_url: Base URL for password reset (frontend)
            
        Returns:
            True if sent successfully, False otherwise
        """
        subject = "Password Reset Request - WealthNavigator AI"
        
        # Construct reset link
        reset_link = f"{reset_url}?token={reset_token}"
        
        body = f"""
Hello,

You requested a password reset for your WealthNavigator AI account.

Click the link below to reset your password:
{reset_link}

This link will expire in 1 hour.

If you didn't request this reset, please ignore this email.

Best regards,
WealthNavigator AI Team
"""
        
        if self.mock_mode:
            logger.info(f"[MOCK EMAIL] To: {email}")
            logger.info(f"[MOCK EMAIL] Subject: {subject}")
            logger.info(f"[MOCK EMAIL] Body:\n{body}")
            logger.info(f"[MOCK EMAIL] Reset Link: {reset_link}")
            return True
        
        # TODO: Production email sending with SendGrid/AWS SES
        try:
            # Example with SendGrid:
            # from sendgrid import SendGridAPIClient
            # from sendgrid.helpers.mail import Mail
            # 
            # message = Mail(
            #     from_email='noreply@wealthnavigator.ai',
            #     to_emails=email,
            #     subject=subject,
            #     plain_text_content=body
            # )
            # sg = SendGridAPIClient(os.environ.get('SENDGRID_API_KEY'))
            # response = sg.send(message)
            # return response.status_code == 202
            pass
        except Exception as e:
            logger.error(f"Failed to send password reset email to {email}: {e}")
            return False
        
        return True


# Global email service instance
email_service = EmailService(mock_mode=True)


def get_email_service() -> EmailService:
    """Get global email service instance."""
    return email_service
