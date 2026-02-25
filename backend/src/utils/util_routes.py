from fastapi import APIRouter, HTTPException
import pandas as pd
from io import StringIO
from datetime import datetime
import httpx
import asyncio
import json
from src.config.logger import get_logger

# DB helpers needed for combined sync/seed route
from src.controllers.resource_controller import seed_db
from src.config.database import get_resources_collection

router = APIRouter()
logger = get_logger(__name__)

SHEET_URL = (
    "https://docs.google.com/spreadsheets/d/e/"
    "2PACX-1vQseXUYiP5m_bSJ__t2I8c2Pfx_N6uwBlmzwJHLAvM_Mw0LQ6u0FqWcECfaWKrAjsr7Z-M4iqJ6DJFM/"
    "pub?gid=0&single=true&output=csv"
)

@router.get("/sync_resources")
async def sync_resources():
    """
    Fetches resource data from the Google Sheet, parses it, 
    and returns a structured summary with the synced resources.
    """
    logger.info("Starting resource sync from Google Sheet...")

    try:
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            logger.debug(f"Fetching CSV from {SHEET_URL}")
            response = await client.get(SHEET_URL)
            response.raise_for_status()
            logger.info("Successfully fetched Google Sheet data.")

        # Parse CSV in a background thread to avoid blocking
        loop = asyncio.get_running_loop()
        df = await loop.run_in_executor(None, pd.read_csv, StringIO(response.text))
        logger.debug(f"Parsed CSV with {len(df)} rows")

        # Convert to JSON string and back to handle NaN values properly
        # pandas to_json converts NaN to null automatically
        resources_json = df.to_json(orient="records")
        resources = json.loads(resources_json)

        logger.info(f"Successfully synced {len(resources)} resources.")
        return {
            "status": "success",
            "source": "google_sheet",
            "synced_at": datetime.utcnow().isoformat(),
            "count": len(resources),
            "resources": resources,
        }
    
    except httpx.RequestError as e:
        logger.error(f"HTTP request failed while fetching sheet: {e}", exc_info=True)
        raise HTTPException(status_code=502, detail=f"Failed to fetch sheet: {str(e)}")

    except Exception as e:
        logger.error(f"Error parsing or processing sheet data: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Parsing error: {str(e)}")


@router.get("/sync_and_seed")
async def sync_and_seed():
    """Fetch the Google Sheet and immediately upsert its contents into MongoDB.

    This is essentially a convenience wrapper around :func:`sync_resources`
    followed by :func:`seed_db`.  The returned JSON combines the results of
    both operations.  Call once at startup or whenever you need the database
    to mirror the sheet.
    """
    try:
        # reuse the existing sync logic
        sheet_result = await sync_resources()
        resources = sheet_result.get("resources", [])

        # temporarily do not filter or skip any rows; let seed_db decide
        # how to handle missing org_name values. Uncomment the following block
        # if you later want to drop those entries before seeding.
        #
        # bad = [r for r in resources if not r.get("org_name")]
        # if bad:
        #     logger.warning(f"Skipping {len(bad)} sheet row(s) missing org_name")
        # resources = [r for r in resources if r.get("org_name")]

        # seed the database with whatever we just fetched
        collection = get_resources_collection()
        seed_result = await seed_db(resources, collection)

        return {
            "sync": sheet_result,
            "seed": seed_result,
        }
    except HTTPException:
        # rethrow FastAPI-specific errors (e.g. bad sync)
        raise
    except Exception as e:
        logger.error(f"Error during sync_and_seed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Sync and seed failed")

    