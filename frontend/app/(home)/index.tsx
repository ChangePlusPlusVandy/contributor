import PageLayout from "@/components/PageLayout";
import { useApi } from "@/lib/api";
import { useEffect } from "react";

export default function Home() {

    const { makeRequest } = useApi();

    useEffect(() => {
        
        makeRequest("resources", {
            method: "GET"
        }).then((result) => {
            console.log(result);
        })

    }, []);

    return (
        <PageLayout title="Home">
        </PageLayout>
    );
}