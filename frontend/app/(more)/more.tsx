import { View, Text, Pressable, StyleProp, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { ReactNode } from "react";

const Button = ({ children }: { children: ReactNode } ) => {

    const scale = useSharedValue<number>(1);
    const style = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }]
    }));

    return (
        <Pressable onPressIn={() => scale.value = withSpring(0.9, { stiffness: 900, damping: 90, mass: 6 })} onPressOut={() => scale.value = withSpring(1, { stiffness: 900, damping: 90, mass: 6 })}>
            <Animated.View style={style}>
                {children}
            </Animated.View>
        </Pressable>
    );

}


export default function More() {
    
    return (
        <SafeAreaView>
            <View className="w-full flex justify-start items-center flex-row pb-[10px] mt-[7px] h-[45px]">
                <Image source={require("../../assets/images/logo-svg.svg")} style={{ width: 42, height: 42, marginLeft: 11, marginRight: 10 }} contentFit="contain" />
                <View>
                    <Text className="font-lexend-semibold text-[18px]">WHERE TO TURN</Text>
                    <Text className="font-lexend-semibold text-[18px]">IN NASHVILLE</Text>
                </View>
                <Image source={require("../../assets/images/bell-pin.svg")} style={{ width: 37, height: 37, marginLeft: "auto", marginRight: 10 }} contentFit="contain" />
            </View>
            <View className="pt-[16px] px-[24px]">
                <Text className="font-lexend-semibold text-[18px] mb-[10px]">Login</Text>
                <View className="flex flex-row items-center">
                    <View style={{ flex: 1, marginRight: 8 }}>
                        <Button>
                            <View className="h-[164px] bg-white rounded-[5px] flex flex-col items-center justify-center" style={{
                                shadowColor: "#000",
                                shadowOffset: { width: 2, height: 2 },
                                shadowOpacity: 0.2,
                                shadowRadius: 4,
                                elevation: 4
                            }}>
                                <Image source={require("../../assets/images/more-page/stand.png")} style={{ aspectRatio: "1/1", height: 75, marginBottom: 18 }} contentFit="contain"/>
                                <Text className="font-lexend-bold text-[18px]">Vendor Login</Text>
                            </View>
                        </Button>
                    </View>
                    <View style={{ flex: 1, marginLeft: 8 }}>
                        <Button>
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
                                <Image source={require("../../assets/images/more-page/book.png")} style={{ aspectRatio: "1/1", height: 75, marginBottom: 18, position: "relative", transform: [{translateY: 8}] }} contentFit="contain" />
                                <Text className="text-[14px] font-lexend-medium opacity-60 text-[14px] max-w-[196px] w-full">We are working on a version for 2026. Request to be notified when those are ready to pick up.</Text>
                            </View>
                        </Button>
                    </View>
                </View>
                <Text className="font-lexend-semibold text-[18px] mt-[18px] mb-[10px]">Register a Resource</Text>
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
                                <Image source={require("../../assets/images/more-page/food.png")} style={{ aspectRatio: "1/1", height: 75, marginBottom: 18 }} contentFit="contain" />
                                <Text className="font-lexend-medium opacity-60 text-[13px] max-w-[196px] w-full">Apply to register a resource or to update an existing entry.</Text>
                            </View>
                        </Button>
                    </View>
                </View>
            </View>

        </SafeAreaView>
    );
}