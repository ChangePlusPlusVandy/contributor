import MapView, { Marker } from 'react-native-maps';
import { StyleSheet} from "react-native";
import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import ResourceModal from './ResourceModal';

export default function MapComponent({ mapData, location }: { mapData: MapResource[], location: Location.LocationObject | null }) {

    const [hasCentered, setHasCentered] = useState<boolean>(false);
    const mapRef = useRef<MapView | null>(null);
    const [modalResource, setModalResource] = useState<MapResource | null>(null);

    useEffect(() => {
        
        if (location && !hasCentered) {
            mapRef.current?.animateToRegion(
                {
                    latitude: location.coords.latitude - 0.01,
                    longitude: location.coords.longitude,
                    latitudeDelta: 0.1,
                    longitudeDelta: 0.1,
                },
                1000 
            );
            setHasCentered(true); 
        }

    }, [location]);

    return (
        <>
            <MapView
                initialRegion={{
                    latitude: 36.145,
                    longitude: -86.78316,
                    latitudeDelta: 0.2,
                    longitudeDelta: 0.2,
                }}
                style={styles.map}
                showsUserLocation={true}
                ref={mapRef}
            >
                {
                    mapData.map((resource: MapResource, key: number) => {

                        return <Marker
                            key={key}
                            coordinate={{ latitude: resource.latitude || 36.125, longitude: resource.longitude || -86.78316 }}
                            calloutOffset={{ x: 0.0, y: -50.0 }}
                            onPress={() => setModalResource(resource)}
                        />

                    })
                }
            </MapView>
            {
                modalResource && <ResourceModal modalResource={modalResource} closeModalResource={() => setModalResource(null)} location={location}/> 
            }
        </>
    );
    
}


const styles = StyleSheet.create({
    map: {
        width: '100%',
        height: '100%',
        overflow: 'hidden',
    },
});