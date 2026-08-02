/**
 * Mirrors CATEGORY_SUBCATEGORIES in backend/src/schemas/resource.py.
 * These strings are compared against stored resource values, so they must match
 * the backend enums exactly. Update both together.
 */
export const CATEGORY_SUBCATEGORIES = {
    "Urgent Needs": [
        "Food",
        "Emergency Shelter",
        "Housing",
        "Personal Care",
        "Rent + Utilities Assistance",
    ],
    "Health and Wellness": [
        "Medical Care",
        "Mental Health",
        "Addiction Services",
        "Nursing Homes + Hospice",
        "Dental + Hearing",
        "HIV, PReP, & HEP C",
    ],
    "Family and Pets": [
        "Tutoring + Mentoring",
        "Childcare",
        "Family Support",
        "Pet Help",
    ],
    "Specialized Assistance": [
        "Seniors + People with Disabilities",
        "Veterans",
        "LGBTQ+",
        "Immigrants + Refugees",
        "Formerly Incarcerated",
    ],
    "Get Help": [
        "Legal Aid",
        "Domestic Violence",
        "Sexual Assault",
        "Advocacy",
        "Social Services",
        "Outside of Davidson County",
        "Phones",
    ],
    "Find Work and Get Connected": [
        "Jobs + Job Training",
        "Adult Education",
        "Arts",
        "Transportation",
    ],
} as const;

export type Category = keyof typeof CATEGORY_SUBCATEGORIES;
export type Subcategory = (typeof CATEGORY_SUBCATEGORIES)[Category][number];

export const CATEGORIES = Object.keys(CATEGORY_SUBCATEGORIES) as Category[];

export const isCategory = (value: string): value is Category => value in CATEGORY_SUBCATEGORIES;
