import type { Category, Subcategory } from "@/constants/categories";

declare global {

    type Weekday = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";

    type Resource = {
        name: string;
        email: string;
        phone: number;
        org_name: string;
        category: Category | null;
        page?: number | null;
        bus_line?: string | null;
        hours?: string | null;
        services?: string | null;
        id_required?: boolean | null;
        requirements?: string | null;
        app_process?: string | null;
        other?: string | null;
        address?: string | null;
        city?: string | null;
        state?: string | null;
        zip_code?: string | null;
        website?: string | null;
        org_phones?: string | null;
        org_email?: string | null;
        removed: boolean;
        coordinates?: {
          latitude: number;
          longitude: number;
        } | null;
        created_at: string;
        subcategory: string;
        group?: string | null;
      };

    /** Home-screen category tile. */
    type CategoryTile = {
        imageURL: string,
        name: Subcategory
    }

    type ActiveVendor = {
        vendor_id: string,
        name: string,
        location: {
            latitude: number,
            longitude: number
        }
    }

    type User = {
        email: string,
        name: string,
        role: string
    }

    type AuthStore = {
        role: "admin" | "vendor",
        accessToken: string,
        refreshToken: string
    }

}

export {};
