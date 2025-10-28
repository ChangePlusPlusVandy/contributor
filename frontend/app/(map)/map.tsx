import { ActivityIndicator, View, StyleSheet } from "react-native";
import PageLayout from "@/components/PageLayout";
import { useApi } from "@/lib/api";
import { useEffect, useState } from "react";
import MapComponent from "@/components/MapComponent";

export default function Map() {

    const { makeRequest } = useApi();
    const [mapData, setMapData] = useState<MapResource[] | undefined>(undefined);

    useEffect(() => {

        makeRequest("resources/", {
            method: "GET"
        }).then((result) => {
            setMapData(result.resources);
        });

    }, []);

    return (
        <PageLayout title="Map">
            {
                mapData === undefined ? (
                    <View className="h-full w-full flex justify-center items-center">
                        <ActivityIndicator size="large" color="black"/>
                    </View>
                ) :
                (
                    <MapComponent mapData={mapData}/>
                )
            }
        </PageLayout>
    );
}

