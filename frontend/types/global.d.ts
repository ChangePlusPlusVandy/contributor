import type { ReactNode } from "react"

declare global {

    type Weekday = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";
    type Categories = "Urgent Needs" | "Health & Wellness" | "Family & Pets" | "Specialized" | "Help" | "Find Work";

    type MapResource = {
        _id: string,
        latitude: number | null,
        longitude: number | null,
        name: string,
        phone: String,
        address: string,
        id_required: boolean,
        category: Categories
        hours: Record<Weekday, [String, String] | null>
    }

    type Resource = {
        imageURL: string,
        name: string
    }

}