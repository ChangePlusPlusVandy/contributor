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

}