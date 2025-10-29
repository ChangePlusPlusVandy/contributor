import MapView, { Marker, Callout } from 'react-native-maps';
import { Pressable, StyleSheet, Text, View, Modal } from "react-native";
import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import { Image } from 'expo-image';

export default function MapComponent({ mapData }: { mapData: MapResource[] }) {

    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [hasCentered, setHasCentered] = useState<boolean>(false);
    const [showModal, setShowModal] = useState<boolean>(false);
    const mapRef = useRef<MapView | null>(null);

    useFocusEffect(

        useCallback(() => {

            async function getCurrentLocation() {
    
                let { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    return;
                }
    
                let location = await Location.getCurrentPositionAsync({});
                setLocation(location);

            }
    
            getCurrentLocation();

        }, [])

    );

    useEffect(() => {
        
        if (location && !hasCentered) {
            mapRef.current?.animateToRegion(
                {
                    latitude: location.coords.latitude,
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

                        const phone: string = resource.phone.toString();

                        return <Marker
                            key={key}
                            coordinate={{ latitude: resource.latitude || 36.125, longitude: resource.longitude || -86.78316 }}
                            calloutOffset={{ x: 0.0, y: -50.0 }}
                            onCalloutPress={() => setShowModal(true)}
                        >
                            <Callout>
                                <Text className='text-xl mb-1'>{resource.org_name}</Text>
                                <Text className='text-black/60 mb-1'>Email: {resource.email}</Text>
                                <Text className='text-black/60 mb-1.5'>Phone: {`${phone.slice(0, 3)}-${phone.slice(3, 6)}-${phone.slice(6)}`}</Text>
                                <Text className='text-blue-500'>Click for More Information</Text>
                            </Callout>
                        </Marker>
                    })
                }
            </MapView>
            <Modal
                visible={showModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowModal(false)}
            >
                <View className='flex-1 items-center justify-center p-6'>
                    <View className='w-full max-w-md rounded-2xl bg-white p-4'>
                        <Image source={require("../assets/images/logo.webp")} style={{ width: 150, height: 50 }} contentFit="contain"/>
                        <Text>More Information Here</Text>
                        <Pressable onPress={() => setShowModal(false)} className='self-end'>
                            <Text className='text-blue-600 font-semibold'>Close</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>
        </>
    );
    
}


const styles = StyleSheet.create({
    map: {
        width: '100%',
        height: '100%',
        borderTopLeftRadius: 18,
        borderTopRightRadius: 18,
        overflow: 'hidden',
    },
});