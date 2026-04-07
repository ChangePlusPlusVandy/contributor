import { View, Text, Pressable, StyleProp, ViewStyle, ScrollView, Dimensions, Linking } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming, Easing } from "react-native-reanimated";
import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/providers/auth";
import MapView, { LatLng, MapPressEvent, Marker } from "react-native-maps";
import * as Location from "expo-location";
import * as SecureStore from "expo-secure-store";
import { useFocusEffect, useRouter } from "expo-router";
import { X } from "lucide-react-native";

const Button = ({ children, onClick }: { children: ReactNode, onClick?: () => void } ) => {

    const scale = useSharedValue<number>(1);
    const style = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }]
    }));

    return (
        <Pressable onPressIn={() => { scale.value = withSpring(0.9, { stiffness: 900, damping: 90, mass: 6 }); onClick?.(); }} onPressOut={() => { scale.value = withSpring(1, { stiffness: 900, damping: 90, mass: 6 }) }}>
            <Animated.View style={style}>
                {children}
            </Animated.View>
        </Pressable>
    );

}

const DefaultMorePage = () => {

    const { user } = useAuth();
    const insets = useSafeAreaInsets();
    const router = useRouter();

    return (
        <View style={{ paddingTop: insets.top }} className="bg-[#F8F8F8]">
            <View className="w-full flex justify-start items-center flex-row pb-[10px] mt-[7px] h-[45px]">
                <Image source={require("../../assets/images/logo-svg.svg")} style={{ width: 42, height: 42, marginLeft: 11, marginRight: 10 }} contentFit="contain" />
                <View>
                    <Text className="font-lexend-semibold text-[18px]">WHERE TO TURN</Text>
                    <Text className="font-lexend-semibold text-[18px]">IN NASHVILLE</Text>
                </View>
                {/* <Image source={require("../../assets/images/bell-pin.svg")} style={{ width: 37, height: 37, marginLeft: "auto", marginRight: 10 }} contentFit="contain" /> */}
            </View>
            <ScrollView className="h-full">
                <View className="pt-[16px] px-[24px]">
                    <Text className="font-lexend-semibold text-[18px] mb-[10px]">Login</Text>
                    <View className="flex flex-row items-center">
                        <View style={{ flex: 1, marginRight: 8 }}>
                            <Button onClick={() => router.push({ pathname: "/(more)/login", params: { role: "vendor" } })}>
                                <View className="h-[164px] bg-white rounded-[5px] flex flex-col items-center justify-center" style={{
                                    shadowColor: "#000",
                                    shadowOffset: { width: 2, height: 2 },
                                    shadowOpacity: 0.2,
                                    shadowRadius: 4,
                                    elevation: 4
                                }}>
                                    <Image source={require("../../assets/images/more-page/stand.png")} style={{ aspectRatio: "1/1", height: 75, marginBottom: 18 }} contentFit="contain" />
                                    <Text className="font-lexend-bold text-[18px]">Vendor Login</Text>
                                </View>
                            </Button>
                        </View>
                        <View style={{ flex: 1, marginLeft: 8 }}>
                            <Button onClick={() => router.push({ pathname: "/(more)/login", params: { role: "admin" } })}>
                                <View className="h-[164px] bg-white rounded-[5px] flex flex-col items-center justify-center" style={{
                                    shadowColor: "#000",
                                    shadowOffset: { width: 2, height: 2 },
                                    shadowOpacity: 0.2,
                                    shadowRadius: 4,
                                    elevation: 4
                                }}>
                                    <Image source={require("../../assets/images/more-page/computer.png")} style={{ aspectRatio: "1/1", height: 75, marginBottom: 18 }} contentFit="contain" />
                                    <Text className="font-lexend-bold text-[18px]">Admin Login</Text>
                                </View>
                            </Button>
                        </View>
                    </View>
                    <Text className="font-lexend-semibold text-[18px] mt-[18px] mb-[10px]">Request Printed Guide</Text>
                    <View className="flex flex-row items-center">
                        <View style={{ flex: 1 }}>
                            <Button>
                                <View className="h-[135px] bg-white rounded-[5px] gap flex flex-row items-center justify-center" style={{
                                    shadowColor: "#000",
                                    shadowOffset: { width: 2, height: 2 },
                                    shadowOpacity: 0.2,
                                    shadowRadius: 4,
                                    elevation: 4,
                                    gap: 27
                                }}>
                                    <Image source={require("../../assets/images/more-page/book.png")} style={{ aspectRatio: "1/1", height: 75, marginBottom: 18, position: "relative", transform: [{ translateY: 8 }] }} contentFit="contain" />
                                    <Text className="text-[14px] font-lexend-medium opacity-60 text-[14px] max-w-[196px] w-full">We are working on a version for 2026. Request to be notified when those are ready to pick up.</Text>
                                </View>
                            </Button>
                        </View>
                    </View>
                    <Text className="font-lexend-semibold text-[18px] mt-[18px] mb-[10px]">Register a Resource</Text>
                    <View className="flex flex-row items-center">
                        <View style={{ flex: 1 }}>
                            <Button onClick={() => Linking.openURL("https://form.jotform.com/jessehaovanderbilt/register-a-resource")}>
                                <View className="h-[135px] bg-white rounded-[5px] gap flex flex-row items-center justify-center" style={{
                                    shadowColor: "#000",
                                    shadowOffset: { width: 2, height: 2 },
                                    shadowOpacity: 0.2,
                                    shadowRadius: 4,
                                    elevation: 4,
                                    gap: 27
                                }}>
                                    <Image source={require("../../assets/images/more-page/food.png")} style={{ aspectRatio: "1/1", height: 75, marginBottom: 18 }} contentFit="contain" />
                                    <Text className="font-lexend-medium opacity-60 text-[13px] max-w-[196px] w-full">Apply to register a resource or to update an existing entry.</Text>
                                </View>
                            </Button>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const NASHVILLE_FALLBACK = {
    latitude: 36.1627,
    longitude: -86.7816,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
};

const VendorMorePage = () => {

    const { user, logout } = useAuth();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const mapRef = useRef<MapView | null>(null);
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [editingLocation, setEditingLocation] = useState<boolean>(false);
    const [pickedLocation, setPickedLocation] = useState<LatLng | null>(null);

    const CLOCK_IN_LOCATION_KEY = "clock_in_location";


    const saveLocationToSecureStore = async (loc: LatLng) => {
        try {
            await SecureStore.setItemAsync(CLOCK_IN_LOCATION_KEY, JSON.stringify(loc));
        } catch (error) {
            console.error("Failed to save location:", error);
        }
    }

    const loadLocationFromSecureStore = async () => {
        try {
            const saved = await SecureStore.getItemAsync(CLOCK_IN_LOCATION_KEY);
            if (saved) {
                const loc = JSON.parse(saved);
                setPickedLocation(loc);
            }
        } catch (error) {
            console.error("Failed to load location:", error);
        }
    }

    const { height: screenHeight } = Dimensions.get("window");
    const MAP_COLLAPSED = 180;
    const HEADER_HEIGHT = 55;
    const LABEL_HEIGHT = 42;
    const MAP_EXPANDED = screenHeight - insets.top - insets.bottom - HEADER_HEIGHT - LABEL_HEIGHT - 80;

    const editing = useSharedValue(0);
    const mapHeight = useSharedValue(MAP_COLLAPSED);
    const contentOpacity = useSharedValue(1);

    const timingConfig = { duration: 400, easing: Easing.inOut(Easing.quad) };

    const toggleEditLocation = () => {
        setEditingLocation(prev => !prev);
        const expanding = editing.value === 0;
        editing.value = expanding ? 1 : 0;
        mapHeight.value = withTiming(expanding ? MAP_EXPANDED : MAP_COLLAPSED, timingConfig);
        contentOpacity.value = withTiming(expanding ? 0 : 1, timingConfig);
    };

    const mapContainerStyle = useAnimatedStyle(() => ({
        height: mapHeight.value,
    }));

    const contentFadeStyle = useAnimatedStyle(() => ({
        opacity: contentOpacity.value,
    }));

    const contentFadeInStyle = useAnimatedStyle(() => ({
        opacity: 1 - contentOpacity.value,
    }));

    const handleMapPress = (e: MapPressEvent) => {
        const newLocation = e.nativeEvent.coordinate;
        setPickedLocation(newLocation);
        saveLocationToSecureStore(newLocation);
    };

    useFocusEffect(
        useCallback(() => {
            async function getCurrentLocation() {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== "granted") return;
                const loc = await Location.getCurrentPositionAsync({});
                setLocation(loc);
            }
            getCurrentLocation();
            loadLocationFromSecureStore();
        }, [])
    );

    useEffect(() => {
        if (location) {
            mapRef.current?.animateToRegion(
                {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                },
                1000
            );
        }
    }, [location]);

    return (
        <View style={{ paddingTop: insets.top, flex: 1 }}>
            <View className="w-full flex justify-start items-center flex-row pb-[10px] mt-[7px] h-[45px]">
                <Image source={require("../../assets/images/logo-svg.svg")} style={{ width: 42, height: 42, marginLeft: 11, marginRight: 10 }} contentFit="contain" />
                <View>
                    <Text className="font-lexend-semibold text-[18px]">WHERE TO TURN</Text>
                    <Text className="font-lexend-semibold text-[18px]">IN NASHVILLE</Text>
                </View>
                {/* <Image source={require("../../assets/images/bell-pin.svg")} style={{ width: 37, height: 37, marginLeft: "auto", marginRight: 10 }} contentFit="contain" /> */}
            </View>
            <ScrollView className="h-full" scrollEnabled={!editingLocation}>
                <View className="pt-[16px] px-[24px]">
                    <Text className="font-lexend-semibold text-[18px] mb-[10px]">Location</Text>
                    <Animated.View style={[mapContainerStyle, { overflow: "hidden", borderRadius: 5 }]}>
                        <View className="bg-white" style={{
                            shadowColor: "#000",
                            shadowOffset: { width: 2, height: 2 },
                            shadowOpacity: 0.2,
                            shadowRadius: 4,
                            elevation: 4,
                            flex: 1,
                            position: "relative"
                        }}>
                            {
                                editingLocation &&
                                <>
                                    <Pressable style={{
                                        position: "absolute",
                                        top: 1,
                                        right: 1,
                                        zIndex: 10
                                    }} onPress={toggleEditLocation}>
                                        <X color="black"/>
                                    </Pressable>
                                    <Text className="absolute top-1 left-1 z-10">
                                        Pick a place to clock in.
                                    </Text>
                                </>
                            }
                            <MapView
                                ref={mapRef}
                                initialRegion={NASHVILLE_FALLBACK}
                                style={{ width: "100%", flex: 1 }}
                                showsUserLocation={true}
                                onPress={editingLocation ? handleMapPress : () => null}
                            >
                                {pickedLocation && (
                                    <Marker
                                        coordinate={pickedLocation}
                                        draggable
                                        onDragEnd={(e) => {
                                            const newLoc = e.nativeEvent.coordinate;
                                            setPickedLocation(newLoc);
                                            saveLocationToSecureStore(newLoc);
                                        }}
                                    />
                                )}
                            </MapView>
                        </View>
                    </Animated.View>
                    <View className="">
                        <Button onClick={!editingLocation ? toggleEditLocation : () => null}>
                            <Animated.View className="h-[33px] mt-[12px] bg-white rounded-[10px] flex flex-row items-center justify-center" style={[contentFadeStyle, {
                                shadowColor: "#000",
                                shadowOffset: { width: 2, height: 2 },
                                shadowOpacity: 0.2,
                                shadowRadius: 4,
                                elevation: 4,
                            }]}>
                                <Text className="font-lexend-medium opacity-60 text-[13px] w-full text-center text-[#2B84E9]">Edit Clock-In Location</Text>
                            </Animated.View>
                        </Button>
                        <Button onClick={() => null}>
                            <Animated.View className="h-[33px] mt-[12px] bg-white rounded-[10px] flex flex-row items-center justify-center" style={[contentFadeStyle, {
                                shadowColor: "#000",
                                shadowOffset: { width: 2, height: 2 },
                                shadowOpacity: 0.2,
                                shadowRadius: 4,
                                elevation: 4,
                            }]}>
                                <Text className="font-lexend-medium opacity-60 text-[13px] w-full text-center text-[#2B84E9]">Clock-In</Text>
                            </Animated.View>
                        </Button>
                    </View>
                    <Animated.View style={contentFadeStyle}>
                        <Text className="font-lexend-semibold text-[18px] mt-[12px] mb-[10px]">Request Printed Guide</Text>
                        <View className="flex flex-row items-center">
                            <View style={{ flex: 1 }}>
                                <Button>
                                    <View className="h-[135px] bg-white rounded-[5px] flex flex-row items-center justify-center" style={{
                                        shadowColor: "#000",
                                        shadowOffset: { width: 2, height: 2 },
                                        shadowOpacity: 0.2,
                                        shadowRadius: 4,
                                        elevation: 4,
                                        gap: 27
                                    }}>
                                        <Image source={require("../../assets/images/more-page/book.png")} style={{ aspectRatio: "1/1", height: 75, marginBottom: 18, position: "relative", transform: [{ translateY: 8 }] }} contentFit="contain" />
                                        <Text className="text-[14px] font-lexend-medium opacity-60 text-[14px] max-w-[196px] w-full">We are working on a version for 2026. Request to be notified when those are ready to pick up.</Text>
                                    </View>
                                </Button>
                            </View>
                        </View>
                        <Button onClick={() => router.push("/(more)/change-password")}>
                            <View className="h-[33px] mt-[18px] bg-white rounded-[10px] flex flex-row items-center justify-center" style={{
                                shadowColor: "#000",
                                shadowOffset: { width: 2, height: 2 },
                                shadowOpacity: 0.2,
                                shadowRadius: 4,
                                elevation: 4,
                            }}>
                                <Text className="font-lexend-medium opacity-60 text-[13px] w-full text-center text-[#2B84E9]">Change Password</Text>
                            </View>
                        </Button>
                        <Button onClick={logout}>
                            <View className="h-[33px] mt-[12px] bg-white rounded-[10px] flex flex-row items-center justify-center" style={{
                                shadowColor: "#000",
                                shadowOffset: { width: 2, height: 2 },
                                shadowOpacity: 0.2,
                                shadowRadius: 4,
                                elevation: 4,
                            }}>
                                <Text className="font-lexend-medium opacity-60 text-[13px] w-full text-center text-[#2B84E9]">Logout</Text>
                            </View>
                        </Button>
                    </Animated.View>
                </View>
            </ScrollView>
        </View>
    );
}

const AdminMorePage = () => {

    const { logout } = useAuth();
    const insets = useSafeAreaInsets();

    return (
        <View style={{ paddingTop: insets.top, flex: 1 }}>
            <Button onClick={logout}>
                <View className="h-[33px] mt-[18px] bg-white rounded-[10px] flex flex-row items-center justify-center mx-[24px]" style={{
                    shadowColor: "#000",
                    shadowOffset: { width: 2, height: 2 },
                    shadowOpacity: 0.2,
                    shadowRadius: 4,
                    elevation: 4,
                }}>
                    <Text className="font-lexend-medium opacity-60 text-[13px] w-full text-center text-[#2B84E9]">Logout</Text>
                </View>
            </Button>
        </View>
    );
}


export default function More() {

    const { user } = useAuth();
    const pages: Record<string, ReactNode> = {
        "vendor": <VendorMorePage/>,
        "admin": <AdminMorePage/>,
        "default": <DefaultMorePage/>
    }

    if (user) {
        return pages[user.role];
    }
    return pages["default"];
    

}