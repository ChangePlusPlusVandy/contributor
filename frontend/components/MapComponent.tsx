import MapView, { Marker, Callout } from 'react-native-maps';
import { Pressable, StyleSheet, Text, View, Modal, Touchable } from "react-native";
import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import Animated, { useSharedValue, useAnimatedStyle, FadeIn, FadeOut, Easing } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { X } from 'lucide-react-native';

export default function MapComponent({ mapData }: { mapData: MapResource[] }) {

    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [hasCentered, setHasCentered] = useState<boolean>(false);
    const mapRef = useRef<MapView | null>(null);
    const [modalResource, setModalResource] = useState<MapResource | null>(null);

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
                            onPress={() => setModalResource(resource)}
                        />

                    })
                }
            </MapView>
            {
                modalResource && <Animated.View 
                    className='absolute bottom-[160px] h-[140px] bg-white rounded-[20px] left-[10px] right-[10px] p-3'
                    entering={FadeIn.duration(300).easing(Easing.inOut(Easing.quad))} 
                    exiting={FadeOut.duration(300).easing(Easing.inOut(Easing.quad))} 
                >
                    <View className="flex flex-row items-center">
                        <Image source={require("../assets/images/logo-svg.svg")} style={{ width: 24, height: 24 }} contentFit="contain" />
                        <Text className="font-lexend-bold text-[14px] ml-[5px] ">{modalResource.name}</Text>
                        <Text className='font-lexend-medium text-[12px] text-[#2B84E9] ml-auto mr-[5px]'>0.5 mi</Text>
                        <Pressable onPress={() => setModalResource(null)}>
                            <X size={25}/>
                        </Pressable>
                    </View>
                    <Text className='font-lexend-bold text-[10px] mt-1'>Services: </Text>
                    <Text className='font-lexend-bold text-[10px] mt-1'>Hours: </Text>
                    <Text className='font-lexend-bold text-[10px] mt-1'>Address: </Text>
                    <Text className='mt-auto font-lexend-medium text-[11px] text-[#2B84E9]'>Directions</Text>
                    <View className='flex justify-between items-center flex-row'>
                        <Text className='mt-[3px] font-lexend-medium text-[11px] text-[#2B84E9]'>Call: xxx-xxx-xxxx</Text>
                        <Text className='font-lexend-medium text-[14px] text-[#57DE48]'>Open</Text>
                    </View>
                </Animated.View>
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