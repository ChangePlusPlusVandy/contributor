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

def prepare_default_fields(address: str) -> dict:
    """Returns default fields for new resources."""
    # what if address is not there
    if address is not None: 
        lat_long = _geocode_address(address)
    else:
        lat_long = None
    
    return {
        "removed": False,
        "created_at": datetime.now(timezone.utc),
        "latitude": lat_long["lat"] if lat_long is not None else None,
        "longitude": lat_long["lng"] if lat_long is not None else None
    }
