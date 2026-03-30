from fastapi import APIRouter, HTTPException
import gspread
from datetime import datetime
import asyncio
from src.config.logger import get_logger
from src.controllers.resource_controller import seed_db
from src.config.database import get_resources_collection
from src.utils.utils import fetch_all_tabs, JSON_KEY_PATH, SHEET_ID

router = APIRouter()
logger = get_logger(__name__)


@router.get("/sync_resources")
async def sync_resources():
    """
    Fetches resource data from all tabs of the Google Sheet and returns
    a structured summary. Each tab name becomes the 'subcategory' value.
    """
    logger.info("Starting resource sync from Google Sheet...")

    try:
        loop = asyncio.get_running_loop()
        resources = await loop.run_in_executor(None, fetch_all_tabs)

        logger.info(f"Successfully synced {len(resources)} resources across all tabs.")
        return {
            "status": "success",
            "source": "google_sheets",
            "synced_at": datetime.utcnow().isoformat(),
            "count": len(resources),
            "resources": resources,
        }

    except FileNotFoundError:
        logger.error(f"Service account key file not found at: {JSON_KEY_PATH}")
        raise HTTPException(status_code=500, detail="Service account key file not found.")

    except gspread.exceptions.SpreadsheetNotFound:
        logger.error(f"Spreadsheet not found with ID: {SHEET_ID}")
        raise HTTPException(status_code=404, detail="Google Sheet not found. Check GOOGLE_SHEET_ID.")

    except Exception as e:
        logger.error(f"Error fetching Google Sheet: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error fetching sheet: {str(e)}")


@router.post("/seed_from_sheets")
async def seed_from_sheets():
    """
    Fetches all resources from Google Sheets and seeds MongoDB.
    Combines sync_resources + seed_db in one call.
    """
    logger.info("Starting seed from Google Sheets into MongoDB...")

    try:
        loop = asyncio.get_running_loop()
        resources = await loop.run_in_executor(None, fetch_all_tabs)
        logger.info(f"Fetched {len(resources)} resources from Google Sheets.")

        collection = get_resources_collection()
        result = await seed_db(resources, collection)

        updated_count = sum(1 for r in result["results"] if r["status"] == "updated")
        inserted_count = sum(1 for r in result["results"] if r["status"] == "inserted")
        logger.info(f"Seed complete: {inserted_count} inserted, {updated_count} updated.")

        return {
            "status": "success",
            "synced_at": datetime.utcnow().isoformat(),
            "total": len(resources),
            "inserted": inserted_count,
            "updated": updated_count,
            "results": result["results"],
        }

    except FileNotFoundError:
        logger.error(f"Service account key file not found at: {JSON_KEY_PATH}")
        raise HTTPException(status_code=500, detail="Service account key file not found.")

    except gspread.exceptions.SpreadsheetNotFound:
        logger.error(f"Spreadsheet not found with ID: {SHEET_ID}")
        raise HTTPException(status_code=404, detail="Google Sheet not found. Check GOOGLE_SHEET_ID.")

    except Exception as e:
        logger.error(f"Error in seed_from_sheets: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Seed failed: {str(e)}")
