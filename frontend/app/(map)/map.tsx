import { ActivityIndicator, View, StyleSheet } from "react-native";
import { useApi } from "@/lib/api";
import { useEffect, useState } from "react";
import MapComponent from "@/components/MapComponent";
import { SafeAreaView } from "react-native-safe-area-context";

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
        <SafeAreaView>
            {
                mapData === undefined ? (
                    <View className="h-full w-full flex justify-center items-center">
                        <ActivityIndicator size="large" color="black" className="relative -translate-y-10"/>
                    </View>
                ) :
                (
                    <MapComponent mapData={mapData}/>
                )
            }
        </SafeAreaView>
    );
}

