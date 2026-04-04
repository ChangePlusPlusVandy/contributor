import os
import gspread
from google.oauth2.service_account import Credentials
from dotenv import load_dotenv, find_dotenv
from opencage.geocoder import OpenCageGeocode
from datetime import datetime, timezone
from src.schemas.resource import Coordinates
from src.config.logger import get_logger

load_dotenv(find_dotenv())

logger = get_logger(__name__)

SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]
JSON_KEY_PATH = os.getenv("JSON_KEY_PATH")
SHEET_ID = os.getenv("GOOGLE_SHEET_ID")


def fetch_all_tabs() -> list[dict]:
    """
    Opens the Google Sheet, iterates all tabs, and returns a flat list
    of raw resource dicts with 'subcategory' injected from the tab name.
    """
    creds = Credentials.from_service_account_file(JSON_KEY_PATH, scopes=SCOPES)
    gc = gspread.authorize(creds)
    spreadsheet = gc.open_by_key(SHEET_ID)

    all_resources = []

    for worksheet in spreadsheet.worksheets():
        subcategory = worksheet.title
        rows = worksheet.get_all_records()
        logger.debug(f"Tab '{subcategory}': {len(rows)} rows")

        for row in rows:
            row["subcategory"] = subcategory
            all_resources.append(row)

    return all_resources

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
    address_str = ", ".join(filter(None, [str(p) for p in address_parts])) if address_parts else None
    
    lat_long = _geocode_address(address=address_str) if address_str else None

    coordinates = (
        Coordinates(latitude=lat_long["lat"], longitude=lat_long["lng"])
        if lat_long else None
    )

    return coordinates

def prepare_default_fields(address_parts: list) -> dict:
    """Returns default fields for new resources."""

    coords = getCoordinatesObj(address_parts=address_parts)
    return {
        "removed": False,
        "created_at": datetime.now(timezone.utc),
        "coordinates": coords.model_dump() if coords else None
    }

# Maps category -> list of subcategories
_CATEGORY_MAP = {
    'Urgent Needs': ['Food', 'Emergency Shelter', 'Housing', 'Personal Care', 'Rent + Utilities Assistance'],
    'Health and Wellness': ['Medical Care', 'Mental Health', 'Addiction Services', 'Nursing Homes + Hospice'],
    'Family and Pets': ['Tutoring + Mentoring', 'Childcare', 'Family Support', 'Pet Help'],
    'Specialized Assistance': ['Seniors + People with Disabilities', 'Veterans', 'LGBTQ+', 'Immigrants + Refugees', 'Formerly Incarcerated'],
    'Get Help': ['Legal Aid', 'Domestic Violence', 'Sexual Assault', 'Advocacy', "ID's, Birth Certificates & Social Services", 'Outside Davidson County', 'Phones'],
    'Find Work': ['Jobs + Job Training', 'Adult Education', 'Arts', 'Transportation']
}

# Inverted: subcategory -> category
_SUBCATEGORY_TO_CATEGORY = {
    sub: cat for cat, subs in _CATEGORY_MAP.items() for sub in subs
}

# Sheet column names -> ResourceBase field names
_COLUMN_MAP = {
    "Category": "group",
    "Org Name": "org_name",
    "Bus Line": "bus_line",
    "Hours": "hours",
    "Services Provided": "services",
    "Requirements": "requirements",
    "Application Process": "app_process",
    "Other": "other",
    "Address": "address",
    "City": "city",
    "State": "state",
    "Zip": "zip_code",
    "Website": "website",
    "Phone": "phone",
}


def normalize_sheet_resource(raw: dict) -> dict:
    """
    Transforms a raw Google Sheets row dict into a resource dict
    compatible with the ResourceBase schema:
    - Renames sheet column keys to model field names
    - Derives 'category' from 'subcategory' via the mapping
    - Converts empty strings to None
    """
    normalized = {}

    for sheet_key, model_key in _COLUMN_MAP.items():
        value = raw.get(sheet_key, None)
        normalized[model_key] = value if value != "" else None

    subcategory = raw.get("subcategory")
    normalized["subcategory"] = subcategory
    normalized["category"] = _SUBCATEGORY_TO_CATEGORY.get(subcategory)

    return normalized


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
    
    # subcategory: first non-empty answer from q35, q36, q37, q39, q40, q41
    subcategory_keys = ['q35_subcategoryUnder', 'q36_typeA36', 'q37_subcategoryUnder37',
                        'q39_subcategoryUnder39', 'q40_subcategoryUnder40', 'q41_subcategoryUnder41']
    subcategory = next((raw_data[k] for k in subcategory_keys if raw_data.get(k)), None)

    # group: first non-empty answer from q42 - q71
    group_keys = ['q42_groupUnder'] + [f'q{n}_groupUnder{n}' for n in range(43, 72)]
    group = next((raw_data[k] for k in group_keys if raw_data.get(k)), None)

    # Add optional fields if they exist and are not empty
    optional_fields = {
        'updated_name': raw_data.get('q22_upatedOrgName'),
        'page': raw_data.get('q11_pageNumber'),
        'category': raw_data.get('q27_category'),
        'subcategory': subcategory,
        'group': group,
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

# def normalize_hours():
    # llm call here