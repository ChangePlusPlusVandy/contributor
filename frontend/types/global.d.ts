import type { ReactNode } from "react"

declare global {

    type PageLayoutProps = {
        title: string,
        children?: React.ReactNode
    }

    type MoreLink = {
        title: string,
        subtitle: string,
        icon: React.ReactNode
    }

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