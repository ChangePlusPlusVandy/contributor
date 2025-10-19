from fastapi import APIRouter, HTTPException
import pandas as pd
import requests
from io import StringIO
from datetime import datetime

router = APIRouter()

SHEET_URL = (
    "https://docs.google.com/spreadsheets/d/e/"
    "2PACX-1vQseXUYiP5m_bSJ__t2I8c2Pfx_N6uwBlmzwJHLAvM_Mw0LQ6u0FqWcECfaWKrAjsr7Z-M4iqJ6DJFM/"
    "pub?gid=0&single=true&output=csv"
)

@router.get("/sync_resources")
def sync_resources():
    try:
        response = requests.get(SHEET_URL, timeout=15)
        response.raise_for_status()

        df = pd.read_csv(StringIO(response.text))
        resources = df.to_dict(orient="records")

        return {
            "status": "success",
            "source": "google_sheet",
            "synced_at": datetime.utcnow().isoformat(),
            "count": len(resources),
            "resources": resources,
        }

    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=502, detail=f"Failed to fetch sheet: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Parsing error: {str(e)}")