from slowapi import Limiter
from slowapi.util import get_remote_address

# Configure global Limiter throttling based on client remote IP address
limiter = Limiter(key_func=get_remote_address)
