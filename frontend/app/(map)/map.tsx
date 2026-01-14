import { ActivityIndicator, View, Text, Pressable } from "react-native";
import { useApi } from "@/lib/api";
import { useEffect, useState } from "react";
import MapComponent from "@/components/MapComponent";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import Animated, { FadeIn, FadeOut, Easing, useSharedValue, useAnimatedStyle, withSpring, interpolateColor, withTiming } from "react-native-reanimated";
import Slider from '@react-native-community/slider';
import { TextInput } from "react-native";
import { clamp } from "@/lib/utils";
import { Keyboard, TouchableWithoutFeedback } from "react-native";

const FilterButton = ({ title, width, height, textSize = 12, onPress = () => null }: { title: string, width: number, height: number, textSize?: number, onPress?: () => void }) => {

    const color = useSharedValue<number>(0);
    const scale = useSharedValue<number>(1);
    const scaleStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }]
    }));

    const colorStyle = useAnimatedStyle(() => {
        const backgroundColor = interpolateColor(
            color.value,
            [0, 1],
            ["#ffffff", "#2B84E999"]
        );

        return { backgroundColor };
    });

    const toggleColor = () => {
        color.value = withTiming(color.value === 0 ? 1 : 0, { duration: 300 });
    };

    return (
        <Pressable onPress={() => { onPress?.(); toggleColor(); }} onPressIn={() => scale.value = withSpring(0.9, { stiffness: 900, damping: 90, mass: 6 })} onPressOut={() => scale.value = withSpring(1, { stiffness: 900, damping: 90, mass: 6 })}>
            <Animated.View
                className={`flex justify-center items-center rounded-[5px] bg-white`}
                style={[
                    {
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: 0.25,
                        shadowRadius: 4,
                        elevation: 4,
                        width,
                        height,
                    },
                    scaleStyle,
                    colorStyle 
                ]}
            >
                <Text style={{ fontSize: textSize }} className="font-lexend-medium text-[12px] text-center">{title}</Text>
            </Animated.View>
        </Pressable>
    );

}

export default function Map() {

    const { makeRequest } = useApi();
    const [mapData, setMapData] = useState<MapResource[] | undefined>(undefined);

    const [showFilter, setShowFilter] = useState<boolean>(false);
    const [distance, setDistance] = useState<number>(20);
    const [distanceText, setDistanceText] = useState<string>("20");

    useEffect(() => {
        
        makeRequest("resources/", {
            method: "GET"
        }).then((result) => {
            setMapData(result.resources);
            // console.log(JSON.stringify(result, null, 4));
        });

    }, []);

    const insets = useSafeAreaInsets();

    return (
        <View className="bg-[#F8F8F8] flex-1" style={{ paddingTop: insets.top, paddingBottom: insets.bottom - 10 }}>
            {
                mapData === undefined ? (
                    <View className="h-full w-full flex justify-center items-center">
                        <ActivityIndicator size="large" color="black" className="relative -translate-y-10"/>
                    </View>
                ) :
                (
                    <>
                        <View className="w-full pb-[10px] relative">
                            <View className="flex items-center flex-row h-[45px]">
                                <Image source={require("../../assets/images/logo-svg.svg")} style={{ width: 42, height: 42, marginLeft: 11, marginRight: 10 }} contentFit="contain"/>
                                <View className="w-[278px] h-[33px] mr-[11px]">
                                    <View className=" bg-[#d9d9d980] rounded-[15px] w-full h-full flex flex-row items-center">
                                        <Image source={require("../../assets/images/search.svg")} style={{ width: 17, height: 17, marginLeft: 8 }} contentFit="contain" />
                                        <Text className="text-[14px] font-lexend-medium text-[#00000059] ml-[6px]">Search resources</Text>
                                    </View>
                                </View>
                                <Image source={require("../../assets/images/bell-pin.svg")} style={{ width: 37, height: 37, marginRight: 10 }} contentFit="contain" />
                            </View>
                            <View className="flex flex-row justify-between items-center mt-[10px] mr-[10px]">
                                <Text className="ml-[12px] font-lexend-medium">Resources near you</Text>
                                <View className="flex flex-row items-start">
                                    <Image source={require("../../assets/images/pin-fill.svg")} style={{ width: 24, height: 24, alignSelf: "flex-start" }} contentFit="contain" />
                                    <View className="mr-[3px]">
                                        <Text className="text-[14px] text-[#2B84E9] font-lexend-medium text-right">Nashville, TN</Text>
                                        <Text className="text-[10px] text-[#2B84E9] font-lexend-medium text-right -mt-[3px]">Distance - {distance} miles</Text>
                                    </View>
                                    <Pressable onPress={() => setShowFilter(prev => !prev)}>
                                        <Image source={require("../../assets/images/filter.svg")} style={{ width: 24, height: 24 }} contentFit="contain" />
                                    </Pressable>
                                </View>
                            </View>

                        </View>
                        <View>
                            {
                                showFilter && (
                                    <Animated.View
                                        entering={FadeIn.duration(300).easing(Easing.inOut(Easing.quad))}
                                        exiting={FadeOut.duration(300).easing(Easing.inOut(Easing.quad))}
                                        className="absolute top-0 left-0 right-0 h-[340px] z-10 bg-[#F8F8F8]"
                                    >
                                        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                                        <View style={{ paddingHorizontal: 40 }}>
                                                <Text className="font-lexend-medium text-[14px]">Distance</Text>
                                                <Text className="font-lexend-medium text-[10px] text-[#767676]">Only show me resources within a specific distance</Text>
                                                <Slider
                                                    style={{ width: "auto", height: 35 }}
                                                    minimumValue={1}
                                                    maximumValue={100}
                                                    value={distance}
                                                    step={1}
                                                    onValueChange={(value) => setDistance(value)}
                                                />
                                                <View className="flex flex-row justify-between items-center">
                                                    <Text className="font-lexend-medium text-[10px] text-[#767676] -mt-[3px]">1</Text>
                                                    <Text className="font-lexend-medium text-[10px] text-[#767676] -mt-[3px]">100</Text>
                                                </View>
                                                <View className="mt-[7px] bg-[#D9D9D9] w-full rounded-[5px] py-[6px] px-[8px]">
                                                    <Text className="text-[#767676] font-lexend-medium text-[10px]">Enter distance (miles)</Text>
                                                    <TextInput
                                                        placeholder="1-100"
                                                        keyboardType="numeric"
                                                        value={distanceText}
                                                        onChangeText={(text) => {
                                                            setDistanceText(text);
                                                            const num = Number(text);
                                                            if (!isNaN(num)) {
                                                                setDistance(clamp(Math.round(num), 1, 100));
                                                            }
                                                        }}
                                                    />
                                                </View>
                                                <View className="mt-[7px] h-[26px] flex items-center flex-row">
                                                    <Text className="font-lexend-medium text-[14px]">Filter</Text>
                                                </View>
                                                <View className="flex flex-row justify-between items-center mt-[8px]">
                                                    <FilterButton title="Open Now" width={145} height={35}/>
                                                    <FilterButton title="ID Not Required" width={145} height={35} />
                                                </View>
                                                <View className="mt-[7px] h-[26px] flex items-center flex-row">
                                                    <Text className="font-lexend-medium text-[14px]">Category</Text>
                                                </View>
                                                <View className="flex flex-row justify-between items-center mt-[8px]">
                                                    <FilterButton title="Urgent Needs" textSize={10} width={98} height={32} />
                                                    <FilterButton title="Health & Wellness" textSize={10} width={98} height={32} />
                                                    <FilterButton title="Family & Pets" textSize={10} width={98} height={32} />
                                                </View>
                                                <View className="flex flex-row justify-between items-center mt-[7px]">
                                                    <FilterButton title="Specialized" textSize={10} width={98} height={32} />
                                                    <FilterButton title="Help" textSize={10} width={98} height={32} />
                                                    <FilterButton title="Find Work" textSize={10} width={98} height={32} />
                                                </View>
                                            </View>
                                        </TouchableWithoutFeedback>
                                    </Animated.View>
                                )
                            }
                            <MapComponent mapData={mapData} />
                        </View>
                    </>
                )
            }
        </View>
    );
}

