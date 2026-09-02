from fastapi import Request
from slowapi import Limiter
from slowapi.util import get_remote_address

def client_ip(request: Request) -> str:
	# Railway's Envoy edge puts the real client IP here; fall back to the socket peer for local dev
	return request.headers.get("x-envoy-external-address") or get_remote_address(request)

# In-memory per-process limits: enough for a single Railway instance at this stage
limiter = Limiter(key_func=client_ip)
