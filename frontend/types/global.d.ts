import type { ReactNode } from "react"


declare global {

    type PageLayoutProps = {
        title: string,
        children?: React.ReactNode
    }

}