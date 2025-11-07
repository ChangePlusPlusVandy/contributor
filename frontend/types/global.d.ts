import type { ReactNode } from "react"

declare global {

    type MapResource = {
        _id: string,
        created_at: string,
        email: string,
        latitude: number | null,
        longitude: number | null,
        name: string,
        org_name: string,
        phone: number,
        removed: boolean
    }

}