import os
from dotenv import load_dotenv
from opencage.geocoder import OpenCageGeocode
from datetime import datetime, timezone
from src.schemas.resource import (
    Coordinates
)

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

def getCoordinatesObj(address_parts: list):
    address_str = ", ".join(filter(None, address_parts)) if address_parts else None
    
    lat_long = _geocode_address(address=address_str) if address_str else None

    coordinates = (
        Coordinates(latitude=lat_long["lat"], longitude=lat_long["lng"])
        if lat_long else None
    )

    return coordinates

def prepare_default_fields(address_parts: list) -> dict:
    """Returns default fields for new resources."""

    return {
        "removed": False,
        "created_at": datetime.now(timezone.utc),
        "coordinates": getCoordinatesObj(address_parts=address_parts)
    }

def extract_field_data(raw_data):
    """
    Extra data from multipart form and converts it into JSON.
    """
    # Extract name (combine first and last)
    name_data = raw_data.get('q5_yourName', {})
    full_name = f"{name_data.get('first', '')} {name_data.get('last', '')}".strip()
    
    # Extract email
    email = raw_data.get('q6_yourEmail', '')
    
    # Extract phone (convert to int, remove non-numeric characters)
    phone_data = raw_data.get('q7_yourPhone', {})
    phone_str = phone_data.get('full', '')
    phone_digits = ''.join(filter(str.isdigit, phone_str))
    phone = int(phone_digits) if phone_digits else None
    
    # Extract organization name
    org_name = raw_data.get('q8_yourOrganization', '')
    
    # Determine if adding or updating
    edit_or_add = raw_data.get('q9_editOrAdd', '')
    add = 'adding' in edit_or_add.lower()
    
    # Build the resource data dict with the required fields
    resource_data = {
        'name': full_name,
        'email': email,
        'phone': phone,
        'org_name': org_name,
        'add': add
    }
    
    # Add optional fields if they exist and are not empty
    optional_fields = {
        'updated_name': raw_data.get('q22_upatedOrgName'),
        'page': raw_data.get('q11_pageNumber'),
        'category': raw_data.get('q27_category'),
        'bus_line': raw_data.get('q28_busLine'),
        'hours': raw_data.get('q17_hoursOpen'),
        'services': raw_data.get('q18_services'),
        'id_required': raw_data.get('q30_idRequired'),
        'requirements': raw_data.get('q19_requirements'),
        'app_process': raw_data.get('q20_appProcess'),
        'other': raw_data.get('q26_other'),
        'address': raw_data.get('q14_orgAddress'),
        'city': raw_data.get('q23_city'),
        'state': raw_data.get('q24_state'),
        'zip_code': raw_data.get('q25_zipCode'),
        'website': raw_data.get('q15_orgWebsite'),
        'org_phones': raw_data.get('q13_orgPhones'),
        'org_email': raw_data.get('q16_orgEmail')
    }

    print(f'optional field data before checking for empty/None: {optional_fields}')
    
    # Only add optional fields if they have values (not empty string or None)
    for key, value in optional_fields.items():
        if value:  # This filters out None and empty strings
            resource_data[key] = value

    print(f"resource data after filtering: {resource_data}")
    
    return resource_data