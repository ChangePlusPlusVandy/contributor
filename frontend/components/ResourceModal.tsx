import Animated, { FadeIn, FadeOut, Easing } from "react-native-reanimated";
import { View, Text, Pressable, Linking, Platform } from "react-native";
import { Image } from "expo-image";
import { getDistanceFromLatLon, hoursToString } from "@/lib/utils";

function formatResourceHours(hours: unknown): string {
    if (hours == null) return "";
    if (typeof hours === "string") return hours;
    if (typeof hours === "object") {
        return hoursToString(hours as Record<Weekday, [string, string] | null>);
    }
    return String(hours);
}
import { X, Bookmark } from "lucide-react-native";
import type { LocationObject } from "expo-location";
import { useState } from "react";
import { useBookmarks } from "@/providers/bookmarks";

function normalizeWebsiteUrl(raw: string | null | undefined): string | null {
    if (raw == null || String(raw).trim() === "") return null;
    const t = String(raw).trim();
    if (/^https?:\/\//i.test(t)) return t;
    return `https://${t}`;
}

export default function ResourceModal({ modalResource, closeModalResource, location, absolute = true }: { modalResource: Resource, closeModalResource: () => void, location: LocationObject | null, absolute?: boolean }) {
    
    const [isCallPressed, setIsCallPressed] = useState<boolean>(false);
    const { isBookmarked, toggleBookmark } = useBookmarks();
    const bookmarked = isBookmarked(modalResource.org_name);
    const websiteUrl = normalizeWebsiteUrl(modalResource.website);

    const openDirections = (latitude: number, longitude: number, label = 'Destination') => {
        const scheme = Platform.select({
          ios: 'maps://?q=',
          android: 'geo:0,0?q=',
        });
        const latLng = `${latitude},${longitude}`;
        const url = Platform.select({
          ios: `${scheme}${label}@${latLng}`,
          android: `${scheme}${latLng}(${label})`
        });
      
        Linking.openURL(url ?? '').catch(err => console.error('An error occurred', err));
      };

    return (
        <Animated.View
            className={`${absolute ? "absolute bottom-[160px] left-[10px] right-[10px]" : "min-w-[100%]"} bg-white rounded-[20px] px-3 py-2`}
            entering={FadeIn.duration(300).easing(Easing.inOut(Easing.quad))}
            exiting={FadeOut.duration(300).easing(Easing.inOut(Easing.quad))}
        >
            <View className="flex flex-row items-center">
                <Image source={require("../assets/images/logo-svg.svg")} style={{ width: 24, height: 24 }} contentFit="contain" />
                <Text className="font-lexend-bold text-[14px] ml-[5px] flex-1" numberOfLines={1}>{modalResource.org_name}</Text>
                <Pressable onPress={() => toggleBookmark(modalResource)} hitSlop={8} className="mr-[4px]">
                    <Bookmark size={18} color="#2B84E9" fill={bookmarked ? "#2B84E9" : "none"} />
                </Pressable>
                <Text className='font-lexend-medium text-[12px] text-[#2B84E9] mr-[5px]'>{getDistanceFromLatLon(modalResource.coordinates?.latitude, modalResource.coordinates?.longitude, location?.coords.latitude, location?.coords.longitude)} mi</Text>
                {
                    absolute && <Pressable onPress={closeModalResource}>
                        <X size={25} />
                    </Pressable>
                }
            </View>
            <Text className='font-lexend-bold text-[10px] mt-2'>Services: <Text className='font-lexend-medium'>{modalResource.services}</Text></Text>
            <Text className='font-lexend-bold text-[10px] mt-1'>Hours: <Text className='font-lexend-medium'>{formatResourceHours(modalResource.hours)}</Text></Text>
            <Text className='font-lexend-bold text-[10px] mt-1'>Address: <Text className='font-lexend-medium'>{modalResource.address}</Text> </Text>
            <View className="mt-2">
                <Pressable onPress={() => openDirections(modalResource.coordinates?.latitude ?? 0, modalResource.coordinates?.longitude ?? 0)}>
                    <Text className='font-lexend-medium text-[11px] text-[#2B84E9]'>Directions</Text>
                </Pressable>
                {websiteUrl != null && (
                    <Pressable
                        onPress={() => Linking.openURL(websiteUrl)}
                        className="mt-1"
                    >
                        <Text className="font-lexend-medium text-[11px] text-[#2B84E9]" numberOfLines={1}>
                            Visit Website
                        </Text>
                    </Pressable>
                )}
            </View>
            <View className='flex justify-between items-center flex-row'>
                <Pressable onPress={() => Linking.openURL(`tel:${modalResource.phone}`)} onPressIn={() => setIsCallPressed(true)} onPressOut={() => setIsCallPressed(false)} className='mt-[3px]'><Text style={{ color: isCallPressed ? '#76b6ffee' : '#2B84E9' }} className='font-lexend-medium text-[11px]'>Call: {modalResource.phone}</Text></Pressable>
            </View>
        </Animated.View>
    );
}