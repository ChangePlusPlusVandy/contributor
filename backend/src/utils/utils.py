import os
from dotenv import load_dotenv
from opencage.geocoder import OpenCageGeocode
from datetime import datetime, timezone

load_dotenv()

def _geocode_address(address: str):
    geocoder = OpenCageGeocode()
    results = geocoder.geocode(address)

    if results and len(results):
        lat = results[0]["geometry"]["lat"]
        lng = results[0]["geometry"]["lng"]
        return {"lat": lat, "lng": lng}
    else:
        return None

def prepare_default_fields() -> dict:
    """Returns default fields for new resources."""
    return {
        "removed": False,
        "created_at": datetime.now(timezone.utc)
    }
