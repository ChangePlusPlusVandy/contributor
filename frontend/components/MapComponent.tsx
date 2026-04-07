import MapView, { Marker, Callout } from 'react-native-maps';
import { StyleSheet, View, Text } from "react-native";
import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import ResourceModal from './ResourceModal';

function resourceCoords(r: Resource): { latitude: number; longitude: number } | null {
    if (r.coordinates?.latitude != null && r.coordinates?.longitude != null) {
        return { latitude: r.coordinates.latitude, longitude: r.coordinates.longitude };
    }
    const legacy = r as Resource & { latitude?: number; longitude?: number };
    if (legacy.latitude != null && legacy.longitude != null) {
        return { latitude: legacy.latitude, longitude: legacy.longitude };
    }
    return null;
}

/** ResourceModal still expects flat lat/lng (and optional org_name from API/JSON). */
function resourceForModal(r: Resource): Resource & { latitude: number; longitude: number; org_name?: string } {
    const c = resourceCoords(r);
    const legacy = r as Resource & { org_name?: string };
    const latitude = c?.latitude ?? 36.125;
    const longitude = c?.longitude ?? -86.78316;
    return { ...r, ...legacy, latitude, longitude };
}

export default function MapComponent({ mapData, activeVendors, location, animateTo }: { mapData: Resource[], activeVendors: ActiveVendor[], location: Location.LocationObject | null, animateTo: { longitude: number, latitude: number } | null }) {

    const [hasCentered, setHasCentered] = useState<boolean>(false);
    const mapRef = useRef<MapView | null>(null);
    const [modalResource, setModalResource] = useState<(Resource & { latitude: number; longitude: number; org_name?: string }) | null>(null);

    useEffect(() => {
        
        if (location && !hasCentered) {
            mapRef.current?.animateToRegion(
                {
                    latitude: location.coords.latitude - 0.005,
                    longitude: location.coords.longitude,
                    latitudeDelta: 0.1,
                    longitudeDelta: 0.1,
                },
                1000 
            );
            setHasCentered(true); 
        }

    }, [location]);

    useEffect(() => {

        if (animateTo) {
            mapRef.current?.animateToRegion(
                {
                    latitude: animateTo.latitude - 0.005,
                    longitude: animateTo.longitude,
                    latitudeDelta: 0.1,
                    longitudeDelta: 0.1,
                },
                1000
            );
        }

    }, [animateTo])

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
                    mapData.map((resource: Resource, key: number) => {
                        const c = resourceCoords(resource);
                        const latitude = c?.latitude ?? 36.125;
                        const longitude = c?.longitude ?? -86.78316;

                        return <Marker
                            key={key}
                            coordinate={{ latitude, longitude }}
                            calloutOffset={{ x: 0.0, y: -50.0 }}
                            onPress={() => setModalResource(resourceForModal(resource))}
                        />

                    })
                }
                {activeVendors.map((vendor) => (
                    <Marker
                        key={vendor.vendor_id}
                        coordinate={{ latitude: vendor.location.latitude, longitude: vendor.location.longitude }}
                        pinColor="#2B84E9"
                    >
                        <Callout>
                            <View style={{ padding: 6, minWidth: 100 }}>
                                <Text style={{ fontWeight: "600", fontSize: 13 }}>{vendor.name}</Text>
                                <Text style={{ fontSize: 11, color: "#16a34a" }}>Clocked In</Text>
                            </View>
                        </Callout>
                    </Marker>
                ))}
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