import { ActivityIndicator, View, StyleSheet } from "react-native";
import PageLayout from "@/components/PageLayout";
import { useApi } from "@/lib/api";
import { useEffect, useState } from "react";
import MapComponent from "@/components/MapComponent";

export default function Map() {

    const { makeRequest } = useApi();
    const [mapData, setMapData] = useState<MapResource[] | undefined>(undefined);

    useEffect(() => {

        makeRequest("resources", {
            method: "GET"
        }).then((result) => {
            setMapData(result.resources);
        });

    }, []);

    return (
        <PageLayout title="Map">
            {
                mapData === undefined ? (
                    <ActivityIndicator size="large" color="black"/>
                ) :
                (
                    <MapComponent mapData={mapData}/>
                )
            }
        </PageLayout>
    );
}

