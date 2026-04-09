from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum

# Model for storing lat/long
class Coordinates(BaseModel):
    latitude: float
    longitude: float


# Enum for category choices
class CategoryChoices(str, Enum):
    URGENT = "Urgent Needs"
    HEALTH = "Health and Wellness"
    FAMILY_PETS = "Family and Pets"
    SPECIAL_ASSISTANCE = "Specialized Assistance"
    HELP = "Get Help"
    WORK = "Find Work and Get Connected"

class SubCategoryChoices(str, Enum):
    # Urgent
    FOOD = "Food"
    EMERGENCY_SHELTER = "Emergency Shelter"
    HOUSING = "Housing"
    PERSONAL_CARE = "Personal Care"
    RENT = "Rent + Utilities Assistance"

    # Health and Wellness
    MEDICAL = "Medical Care"
    MENTAL = "Mental Health"
    ADDICTION = "Addiction Services"
    NURSING = "Nursing Homes + Hospice"
    DENTAL_HEARING = "Dental and Hearing"
    HIV_MORE = "HIV, PReP, & HEP C"

    # Family and Pets
    TUTORING = "Tutoring + Mentoring"
    CHILDCARE = "Childcare"
    FAMILY_SUPPORT = "Family Support"
    PET_HELP = "Pet Help"

    # Specialized Assistance
    SENIORS_DISABILITY = "Seniors + People with Disabilities"
    VETS = "Veterans"
    LGBTQ = "LGBTQ+"
    IMMIGRANTS_REFUGEES = "Immigrants + Refugees"
    INCARCERATED = "Formerly Incarcerated"

    # Get Help
    LEGAL = "Legal Aid"
    DOMESTIC = "Domestic Violence"
    SEXUAL_ASSAULT = "Sexual Assault"
    ADVOCACY = "Advocacy"
    SOCIAL_SERVICES = "ID's, Birth Certificates & Social Services"
    OUTSIDE_DAVIDSON = "Outside of Davidson County"

    # Find Work and Get Connected
    PHONES = "Phones"
    JOBS = "Jobs + Job Training"
    ADULT_EDU = "Adult Education"
    ARTS = "Arts"
    TRANSPORTATION = "Transportation"

class GroupChoices(str, Enum):
    # Food
    BOXES = "Boxes & Pantries"
    GARDEN = "Community Garden"
    SUPPLIES = "Food and Supplies"
    SNAP = "SNAP"
    WIC = "Wic (Women, Infants, and Children) Program"
    
    # Emergency shelter
    DAY = "Day Shelters"
    EMERGENCY = "Emergency Shelters"

    # Housing
    AGENCIES = "Housing Agencies and Resources"
    TRANSITIONAL = "Transitional Housing & Halfway Houses"
    SECTION_8_VOUCHERS = "Section 8 Vouchers"
    OVER_65 = "For Over 65 & On Disability"
    UNDER_62 = "For Under 62 Not Receiving Disability and No Section 8 Voucher"
    SO_REGISTRY = "For People on the Sex Offender Registry"
    MOTELS = "Motels"

    # Personal care
    CLOTHING = "Clothing"
    LAUNDRY = "Laundry"
    SHOWERS = "Showers"

    # Rent
    RENT = "Rent And Utilities Assistance"

    # Medical
    PROVIDERS = "Health Providers"
    HOSPITALS = "Hospitals & Financial Assistance"
    HEALTH_IMMIGRANT = "Medical Resources for Refugees and Immigrants"
    RESPITE = "Medical Respite Care"
    SPECIALISTS = "Medical Specialists"
    MEDICATION = "Medication Resources"
    HORMONE = "Transgender Hormone Therapy"
    WOMEN = "Women's Health Care"

    # Mental Health
    MENTAL_HEALTH = "Mental Health Services"
    PEER_GROUP = "Peer Support Group"
    COUNSELING = "Counseling Services"

    # Addiction
    ADDICT_SERVICES = "Addiction Services"
    WOMEN_SUBSTANCE_ABUSE = "Women's Alcohol/Substance Abuse Groups"
    ADDICT_PEER_GROUP = "Peer Support / 12 Step Groups"
    RECOVERING_HOUSING = "Recovering Housing with 12-Step Programs"
    INTENSIVE_OUTPATIENT = "Intensive Outpatient Programs"
    DETOX = "Detox/Inpatient Help"
    METHADONE = "Methadone Treatment"
    MAT = "Outpatient “MAT” Services (buprenorphine)"

    # Nursing Homes + Hospice
    HOSPICE = "Hospice Care"
    NURSING_HOME = "Nursing Home Care"

    # Dental and Hearing
    DENTAL = "Dental Care"
    HEARING = "Hearing Care"

    # PReP, HIV, Hep C
    PREP_HIV_HEPC = "PrEP, HIV, Hep C Treatment"

    # Tutoring and Mentoring
    MENTORING_CHILDREN = "Mentoring For Children"
    TUTORING = "Tutoring"

    # Childcare
    CHILDCARE = "Childcare"

    # Family Support
    FAMILY_SUPPORT = "Family Support"
    RESOURCE_CENTERS = "Family Resource Centers"
    HEALTH_SERVICES = "Health Services"
    PARENTING_INFO = "Parenting Information"
    HOMELESS_YOUTH = "Programs And Shelters For Homeless Youth"
    FAMILY_SHELTERS = "Shelters For Families"
    FAMILY_COUNSELING = "Programs and Counseling for Families"

    # Pet Help
    PETS = "Pets"

    # Seniors + Disabilities
    DISABILITY = "Disability Advocacy"
    SENIOR_SERVICES = "Senior Services"

    # Veterans
    VET_SERVICES = "Veterans Services"

    # LGBTQ+
    LGBTQ = "LBGTQ+"

    # Immigrants and Refugees
    IMMIGRANT_REFUGEE = "Immigrant/Refugee Services"
    ENGLISH_FREE = "Free English Classes"
    ENGLISH_NONFREE = "English Classes - For a Cost"

    # Formerly Incarcerated
    FORMERLY_INCARCERATED = "Formerly Incarcerated"

    # Legal Services
    LEGAL_SERVICES = "Legal Services"

    # Domestic Violence
    DOMESTIC_VIOLENCE_SHELTERS = "Domestic Violence Shelters"

    # Sexual Assault
    SEXUAL_ASSAULT = "Sexual Assault Care"

    # Advocacy
    ADVOCACY = "Advocacy"

    # ID, Birth Certificate, Social Services
    SOCIAL_SERVICES = "Social Services"

    # Outside Davidson
    CHEATHAM = "Cheatham"
    DICKSON = "Dickson"
    MONTGOMERY = "Montgomery"
    ROBERTSON = "Robertson"
    RUTHERFORD = "Rutherford"
    SUMNER = "Sumner"
    WILLIAMSON = "Williamson"
    WILSON = "Wilson"

    # Phones
    PHONES = "Phones"

    # Jobs + Job Training
    EMPLOYMENT = "Employment"

    # Adult Education
    HISET = "HiSET Classes"
    FINANCIAL_EDU = "Financial Education"
    TUTORING_CAREER = "Tutoring And Career Programs"

    # Arts
    ARTS = "Arts"

    # Transportation
    TRANSPORTATION = "Transportation"


# schema for resource base
class ResourceBase(BaseModel): 
    """
    Shared fields for all resource types (both regular and pending)
    """
    # required
    name: str
    email: str
    phone: int
    org_name: str

    # optional
    page: int | None = None
    category: CategoryChoices | None = None
    subcategory: SubCategoryChoices | None = None
    group: GroupChoices | None = None 
    bus_line: str | None = None
    hours: str | None = None
    services: str | None = None
    id_required: bool| None = False
    requirements: str | None = None
    app_process: str | None = None
    other: str | None = None

    address: str | None = None
    city: str | None = None
    state: str | None = None
    zip_code: str | None = None
    website: str | None = None
    org_phones: str | None = None
    org_email: str | None = None


class Resource(ResourceBase):
    """
    Resource in the main 'resources' collection
    """
    removed: bool
    coordinates: Coordinates | None = None
    created_at: datetime


class PendingResource(ResourceBase):
    """
    Resources awaiting admin approval, in the 'pending' collection
    """
    # add vs. edit boolean required 
    add: bool

    updated_name: str | None = None
    page: str | None = None

    # metadata
    original_resource_id: str | None  = None
    submitted_at: datetime | None = None
