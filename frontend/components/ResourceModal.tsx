import Animated, { FadeIn, FadeOut, Easing } from "react-native-reanimated";
import { View, Text, Pressable, Linking } from "react-native";
import { Image } from "expo-image";
import { getDistanceFromLatLon, hoursToString, isOpen, day, time } from "@/lib/utils";
import { X } from "lucide-react-native";
import type { LocationObject } from "expo-location";
import { useState } from "react";

export default function ResourceModal({ modalResource, closeModalResource, location, absolute = true }: { modalResource: MapResource, closeModalResource: () => void, location: LocationObject | null, absolute?: boolean }) {
    
    const [isCallPressed, setIsCallPressed] = useState<boolean>(false);

    return (
        <Animated.View
            className={`${absolute ? "absolute bottom-[160px] left-[10px] right-[10px]" : ""} h-[145px] bg-white rounded-[20px] px-3 py-2`}
            entering={FadeIn.duration(300).easing(Easing.inOut(Easing.quad))}
            exiting={FadeOut.duration(300).easing(Easing.inOut(Easing.quad))}
        >
            <View className="flex flex-row items-center">
                <Image source={require("../assets/images/logo-svg.svg")} style={{ width: 24, height: 24 }} contentFit="contain" />
                <Text className="font-lexend-bold text-[14px] ml-[5px] ">{modalResource.name}</Text>
                <Text className='font-lexend-medium text-[12px] text-[#2B84E9] ml-auto mr-[5px]'>{getDistanceFromLatLon(modalResource.latitude, modalResource.longitude, location?.coords.latitude, location?.coords.longitude)} mi</Text>
                {
                    absolute && <Pressable onPress={closeModalResource}>
                        <X size={25} />
                    </Pressable>
                }
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
    );
}