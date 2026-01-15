import MapView, { Marker, Callout } from 'react-native-maps';
import { Pressable, StyleSheet, Text, View } from "react-native";
import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';
import Animated, { FadeIn, FadeOut, Easing } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { X } from 'lucide-react-native';
import { Linking } from 'react-native'
import { isOpen, hoursToString, time, day, getDistanceFromLatLon } from '@/lib/utils';

export default function MapComponent({ mapData, location }: { mapData: MapResource[], location: Location.LocationObject | null }) {

    const [hasCentered, setHasCentered] = useState<boolean>(false);
    const mapRef = useRef<MapView | null>(null);
    const [modalResource, setModalResource] = useState<MapResource | null>(null);
    const [isCallPressed, setIsCallPressed] = useState<boolean>(false);

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
                    className='absolute bottom-[160px] h-[145px] bg-white rounded-[20px] left-[10px] right-[10px] px-3 py-2'
                    entering={FadeIn.duration(300).easing(Easing.inOut(Easing.quad))} 
                    exiting={FadeOut.duration(300).easing(Easing.inOut(Easing.quad))} 
                >
                    <View className="flex flex-row items-center">
                        <Image source={require("../assets/images/logo-svg.svg")} style={{ width: 24, height: 24 }} contentFit="contain" />
                        <Text className="font-lexend-bold text-[14px] ml-[5px] ">{modalResource.name}</Text>
                        <Text className='font-lexend-medium text-[12px] text-[#2B84E9] ml-auto mr-[5px]'>{getDistanceFromLatLon(modalResource.latitude, modalResource.longitude, location?.coords.latitude, location?.coords.longitude)} mi</Text>
                        <Pressable onPress={() => setModalResource(null)}>
                            <X size={25}/>
                        </Pressable>
                    </View>
                    <Text className='font-lexend-bold text-[10px] mt-1'>Services: <Text className='font-lexend-medium'>Lorem ipsum, lorem ipsum.</Text></Text>
                    <Text className='font-lexend-bold text-[10px] mt-1'>Hours: <Text className='font-lexend-medium'>{hoursToString(modalResource.hours)}</Text></Text>
                    <Text className='font-lexend-bold text-[10px] mt-1'>Address: <Text className='font-lexend-medium'>{modalResource.address}</Text> </Text>
                    <Pressable className='mt-auto'><Text className='font-lexend-medium text-[11px] text-[#2B84E9]'>Directions</Text></Pressable>
                    <View className='flex justify-between items-center flex-row'>
                        <Pressable onPress={() => Linking.openURL(`tel:${modalResource.phone}`)} onPressIn={() => setIsCallPressed(true)} onPressOut={() => setIsCallPressed(false)} className='mt-[3px]'><Text style={{ color: isCallPressed ? '#76b6ffee' : '#2B84E9' }} className='font-lexend-medium text-[11px]'>Call: {modalResource.phone}</Text></Pressable>
                        <Text className={`font-lexend-medium text-[14px] ${isOpen(modalResource.hours, day, time) ? "text-[#57DE48]" : "text-red-500"}`}>{isOpen(modalResource.hours, day, time) ? "Open" : "Closed"}</Text>
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