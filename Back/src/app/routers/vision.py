import base64
import binascii
import os
import httpx
from fastapi import APIRouter, BackgroundTasks, Request
from pydantic import BaseModel, field_validator
from typing import Optional
from services.s3Services import upload_interaction
from services.rate_limit import limiter

MODAL_URL = "https://ncdev1919--cmu-tour-guide-cv-recognize-building-lp.modal.run"
MAX_IMAGE_BASE64_CHARS = 12_000_000  # ~9MB JPEG; a full-quality phone photo fits
JPEG_MAGIC = b"\xff\xd8\xff"

class VisionRequest(BaseModel):
	imageBase64: str

	@field_validator("imageBase64")
	@classmethod
	def must_be_jpeg(cls, v: str) -> str:
		# Strip data-URL prefix, bound size, then require JPEG bytes so only photos reach Modal and S3
		v = v.split(",", 1)[-1]
		if len(v) > MAX_IMAGE_BASE64_CHARS:
			raise ValueError("image too large")
		try:
			head = base64.b64decode(v, validate=True)[:3]
		except (binascii.Error, ValueError):
			raise ValueError("image is not valid base64")
		if head != JPEG_MAGIC:
			raise ValueError("image must be a JPEG")
		return v

class VisionResponse(BaseModel):
	building_name: str
	confidence: float
	error: Optional[str] = None

router = APIRouter(prefix="", tags=["image"])

# Below this the client asks the user to retry instead of unlocking. Env-tunable so it can move without an app release.
VISION_MIN_CONFIDENCE = float(os.getenv("VISION_MIN_CONFIDENCE", "0.6"))  # see CV/src/eval_confidence.py
LOW_CONFIDENCE = "LOW_CONFIDENCE"

def apply_threshold(reply: VisionResponse, threshold: float = VISION_MIN_CONFIDENCE) -> VisionResponse:
	"""Flag recognised-but-unsure results; keeps building_name/confidence for logging."""
	if reply.error is None and reply.confidence < threshold:
		return reply.model_copy(update={"error": LOW_CONFIDENCE})
	return reply

@router.post("/vision", response_model=VisionResponse)
@limiter.limit("20/minute")
async def image(request: Request, req: VisionRequest, background_tasks: BackgroundTasks):
	reply = apply_threshold(await recognize_building(req.imageBase64))
	# Low-confidence scans are the most useful training data, so upload those too
	if reply.error in (None, LOW_CONFIDENCE):
		background_tasks.add_task(
            upload_interaction, 
            req.imageBase64, 
            reply.building_name, 
            reply.confidence
        )

	return reply

async def recognize_building(image_base64: str) -> VisionResponse:
	try:
		async with httpx.AsyncClient(timeout=30.0) as client:
			# Modal proxy auth token pair: https://modal.com/docs/guide/webhook-proxy-auth
			response = await client.post(
				MODAL_URL,
				json={"imageBase64": image_base64},
				headers={
					"Content-Type": "application/json",
					"Modal-Key": os.getenv("VISION_PROXY_KEY", ""),
					"Modal-Secret": os.getenv("VISION_PROXY_SECRET", ""),
				}
			)
			response.raise_for_status()
			res_json =  response.json()
			print(res_json)
			# Modal reports failures in a 200 body; surface them instead of reading them as confidence 0
			if res_json.get("error"):
				return _error_response(res_json.get("description", ""), res_json["error"])
			raw_building = res_json.get("building", "Unknown")
			confidence = float(res_json.get("confidence", 0.0))
			return VisionResponse(building_name=raw_building, confidence=confidence, error=None)
	except httpx.TimeoutException:
		return _error_response("Request to Modal API timed out", "TIMEOUT")
	except httpx.HTTPStatusError as e:
		return _error_response(
			f"Modal API returned error: {e.response.status_code}",
			f"HTTP_{e.response.status_code}"
		)
	except Exception as e:
		return _error_response(f"Failed to call Modal API: {str(e)}", str(e))

def _error_response(description: str, error: str) -> VisionResponse:
	return VisionResponse(
		building_name="Error",
		confidence=0.0,
		error=error
	)