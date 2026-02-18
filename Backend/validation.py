"""Input validation and data sanitization utilities"""
import re
from typing import Optional, Tuple
import logging

logger = logging.getLogger(__name__)

class ValidationError(Exception):
    """Custom validation error"""
    pass

def validate_email(email: str) -> Tuple[bool, Optional[str]]:
    """
    Validate email format - RFC 5322 simplified
    
    Returns:
        Tuple[bool, Optional[str]]: (is_valid, error_message)
    """
    if not isinstance(email, str):
        return False, "Email must be a string"
    
    email = email.strip()
    if not email:
        return False, "Email cannot be empty"
    
    if len(email) > 254:
        return False, "Email is too long"
    
    # Simple regex for email validation
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(pattern, email):
        return False, "Invalid email format"
    
    return True, None

def validate_password(password: str) -> Tuple[bool, Optional[str]]:
    """
    Validate password strength
    
    Requirements:
    - Minimum 8 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one digit
    - At least one special character
    
    Returns:
        Tuple[bool, Optional[str]]: (is_valid, error_message)
    """
    if not isinstance(password, str):
        return False, "Password must be a string"
    
    if len(password) < 8:
        return False, "Password must be at least 8 characters"
    
    if len(password) > 128:
        return False, "Password is too long"
    
    if not re.search(r'[A-Z]', password):
        return False, "Password must contain at least one uppercase letter"
    
    if not re.search(r'[a-z]', password):
        return False, "Password must contain at least one lowercase letter"
    
    if not re.search(r'\d', password):
        return False, "Password must contain at least one digit"
    
    if not re.search(r'[!@#$%^&*()_+\-=\[\]{};:\'",.<>?/\\|`~]', password):
        return False, "Password must contain at least one special character"
    
    return True, None

def validate_display_name(name: str) -> Tuple[bool, Optional[str]]:
    """
    Validate display name
    
    Requirements:
    - 2-100 characters
    - Only letters, numbers, spaces, hyphens
    
    Returns:
        Tuple[bool, Optional[str]]: (is_valid, error_message)
    """
    if not isinstance(name, str):
        return False, "Display name must be a string"
    
    name = name.strip()
    if len(name) < 2:
        return False, "Display name must be at least 2 characters"
    
    if len(name) > 100:
        return False, "Display name must be 100 characters or less"
    
    pattern = r'^[a-zA-Z0-9\s\-\']+$'
    if not re.match(pattern, name):
        return False, "Display name can only contain letters, numbers, spaces, hyphens, and apostrophes"
    
    return True, None

def validate_bankroll(amount: float) -> Tuple[bool, Optional[str]]:
    """
    Validate bankroll amount
    
    Requirements:
    - Non-negative number
    - Maximum $1,000,000
    
    Returns:
        Tuple[bool, Optional[str]]: (is_valid, error_message)
    """
    try:
        amount = float(amount)
    except (TypeError, ValueError):
        return False, "Bankroll must be a valid number"
    
    if amount < 0:
        return False, "Bankroll cannot be negative"
    
    if amount > 1_000_000:
        return False, "Bankroll exceeds maximum allowed ($1,000,000)"
    
    return True, None

def validate_odds(odds: float) -> Tuple[bool, Optional[str]]:
    """
    Validate betting odds (American format)
    
    Valid range:
    - Between -1000 and 10000
    
    Returns:
        Tuple[bool, Optional[str]]: (is_valid, error_message)
    """
    try:
        odds = float(odds)
    except (TypeError, ValueError):
        return False, "Odds must be a valid number"
    
    if not (-1000 <= odds <= 10000):
        return False, "Odds must be between -1000 and 10000"
    
    if odds == 0:
        return False, "Odds cannot be zero"
    
    return True, None

def sanitize_string(text: str, max_length: int = 500) -> str:
    """
    Sanitize and limit string input
    
    Args:
        text: String to sanitize
        max_length: Maximum allowed length
    
    Returns:
        Sanitized string
    """
    if not isinstance(text, str):
        return ""
    
    # Remove leading/trailing whitespace
    text = text.strip()
    
    # Limit length
    text = text[:max_length]
    
    # Remove control characters
    text = ''.join(char for char in text if ord(char) >= 32)
    
    return text

class UserDataValidator:
    """Validator for user signup and profile data"""
    
    @staticmethod
    def validate_signup_data(email: str, password: str, display_name: str) -> Tuple[bool, list]:
        """
        Validate complete signup data
        
        Returns:
            Tuple[bool, list]: (is_valid, error_messages)
        """
        errors = []
        
        email_valid, email_error = validate_email(email)
        if not email_valid:
            errors.append(email_error)
        
        password_valid, password_error = validate_password(password)
        if not password_valid:
            errors.append(password_error)
        
        name_valid, name_error = validate_display_name(display_name)
        if not name_valid:
            errors.append(name_error)
        
        return len(errors) == 0, errors
    
    @staticmethod
    def validate_bet_data(game_id: str, side: str, amount: float, odds: float) -> Tuple[bool, list]:
        """
        Validate bet placement data
        
        Returns:
            Tuple[bool, list]: (is_valid, error_messages)
        """
        errors = []
        
        if not isinstance(game_id, str) or not game_id:
            errors.append("Invalid game ID")
        
        if side not in ['fav', 'dog']:
            errors.append("Side must be either 'fav' or 'dog'")
        
        amount_valid, amount_error = validate_bankroll(amount)
        if not amount_valid:
            errors.append(f"Invalid bet amount: {amount_error}")
        
        odds_valid, odds_error = validate_odds(odds)
        if not odds_valid:
            errors.append(f"Invalid odds: {odds_error}")
        
        return len(errors) == 0, errors
