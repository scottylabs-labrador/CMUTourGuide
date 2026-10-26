from fastapi import Request
from slowapi import Limiter
from slowapi.util import get_remote_address

def client_ip(request: Request) -> str:
	# Railway's edge sets X-Real-IP and drops client-supplied values (docs: networking/public-networking/specs-and-limits); socket peer for local dev
	return request.headers.get("x-real-ip") or get_remote_address(request)

# In-memory per-process limits: enough for a single Railway instance at this stage
limiter = Limiter(key_func=client_ip)
