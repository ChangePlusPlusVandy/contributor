import os
from dotenv import load_dotenv
from opencage.geocoder import OpenCageGeocode

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

