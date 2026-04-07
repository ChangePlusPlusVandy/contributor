import { ActivityIndicator, View, Text, Pressable, Dimensions } from "react-native";
import { useApi } from "@/lib/api";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import MapComponent from "@/components/MapComponent";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import Animated, { FadeIn, FadeOut, Easing, useSharedValue, useAnimatedStyle, withSpring, interpolateColor, withTiming } from "react-native-reanimated";
import Slider from '@react-native-community/slider';
import { TextInput } from "react-native";
import { clamp, isOpen, time, day, getDistanceFromLatLon } from "@/lib/utils";
import { Keyboard, TouchableWithoutFeedback, PanResponder } from "react-native";
import { useFocusEffect } from 'expo-router';
import * as Location from 'expo-location';
import { ScrollView } from "react-native";
import ResourceModal from "@/components/ResourceModal";
import debounce from "lodash.debounce"

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

const CATEGORY_SUBCATEGORIES: Record<Categories, string[]> = {
    "Urgent Needs": ["Food", "Personal Care", "Emergency Shelter", "Housing", "Rent + Utilities Assistance"],
    "Health and Wellness": ["Medical Care", "Mental Health", "Addiction Services", "Nursing Homes & Hospice", "Dental + Hearing", "HIV PrEP, & HEP C"],
    "Family and Pets": ["Tutoring & Mentoring", "Childcare", "Family Support", "Pet Help"],
    "Specialized Assistance and Help": [
        "Tutoring & Mentoring", "Veterans", "LGBTQ+", "Immigrants + Refugees", "Formerly Incarcerated",
        "Legal Aid", "Domestic Violence", "Sexual Assault", "Advocacy", "Identification", "Outside Davidson Country", "Phones"
    ],
    "Find Work": ["Jobs + Training", "Adult Education", "Arts", "Transportation"],
    "Get Help": [""]
};

const FilterButton = ({ title, width, height, isPressed, toggleFilter, toggleOther, textSize = 12, onPress = () => null }: { title: string, width: number, height: number, isPressed: boolean, toggleFilter?: (category: Categories) => void, toggleOther?: () => void, textSize?: number, onPress?: () => void }) => {

    const color = useSharedValue<number>(isPressed ? 1 : 0);
    const scale = useSharedValue<number>(1);

    useEffect(() => {
        color.value = withTiming(isPressed ? 1 : 0, { duration: 300 });
    }, [isPressed]);
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
        <Pressable onPress={() => { onPress?.(); toggleColor(); toggleFilter?.(title as Categories); toggleOther?.(); }} onPressIn={() => scale.value = withSpring(0.9, { stiffness: 900, damping: 90, mass: 6 })} onPressOut={() => scale.value = withSpring(1, { stiffness: 900, damping: 90, mass: 6 })}>
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

const TopPanel = ({ resources, location, setAnimateTo }: { resources: Resource[], location: Location.LocationObject | null, setAnimateTo: (longitude: number, latitude: number) => void }) => {

    const height = useSharedValue(30);
    const opened = useRef<boolean>(false);
    const style = useAnimatedStyle(() => ({
        height: height.value
    }));

    const insets = useSafeAreaInsets();
    const { height: screenHeight } = Dimensions.get("window");
    const panelHeight = screenHeight - insets.bottom - 207;

    const panResponser = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > Math.abs(gesture.dx),
            onPanResponderMove: (_, gesture) => {
                height.value = Math.max(30, Math.min((opened.current ? panelHeight : 0) + gesture.dy, panelHeight));
            },
            onPanResponderRelease: (_, gesture) => {
                height.value = gesture.dy > 50 ? withSpring(panelHeight) : withSpring(30);
                opened.current = gesture.dy > 50;
            }
        })
    ).current;

    return (
        <Animated.View style={style} className="w-full bg-[#F8F8F8] absolute overflow-hidden top-[112%] z-10 rounded-b-[20px]">
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ alignItems: "center", display: "flex" }}>
                <View className="h-[22px]">
                    <Text className="text-[#00000033] font-lexend text-[10px]">Press and hold on a organization to navigate to it</Text>
                </View>
                {
                    resources.map((val, key) => (
                        <Pressable onLongPress={() => { const c = resourceCoords(val); if (c) setAnimateTo(c.longitude, c.latitude) }} key={key} className="mb-[10px] mx-[10px]">
                            <ResourceModal absolute={false} modalResource={val} closeModalResource={() => { }} location={location}/>
                        </Pressable>
                    ))
                }
            </ScrollView>
            <View {...panResponser.panHandlers} className="w-full mt-auto h-[30px] relative">
                <Text className="text-[#00000033] font-lexend absolute left-1/2 -translate-x-1/2 text-[10px] bottom-[13px]">View results</Text>
                <View className="h-[3px] w-[50px] bg-[#D9D9D9] absolute bottom-[7px] left-1/2 -translate-x-1/2"></View>
            </View>
        </Animated.View>
    );
}

export default function Map() {

    const [mapData, setMapData] = useState<Resource[] | undefined>(undefined);
    const [activeVendors, setActiveVendors] = useState<ActiveVendor[]>([]);
    const insets = useSafeAreaInsets();

    const [showFilter, setShowFilter] = useState<boolean>(false);
    const [distance, setDistance] = useState<number>(20);
    const [distanceText, setDistanceText] = useState<string>("20");
    const [selectedCategory, setSelectedCategory] = useState<Categories | null>(null);
    const [subcategoryFilter, setSubcategoryFilter] = useState<string | null>(null);
    const [idRequired, setIDRequired] = useState<boolean>(false);
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [animateTo, setAnimateTo] = useState<{ longitude: number, latitude: number } | null>(null);
    const [search, setSearch] = useState<string>("");

    const onSearchChange = useCallback(debounce((val: string) => setSearch(val), 400), []);
    const onSliderChange = useCallback(debounce((val: number) => setDistance(val), 400), []);

    const { makeRequest } = useApi();

    useEffect(() => {
        makeRequest("resources/", { method: "GET" }).then((result) => {
            if (result.error != null) { setMapData([]); return; }
            const raw = result.resources;
            const list = Array.isArray(raw) ? raw.filter((r: unknown): r is Resource => r != null && typeof r === "object") : [];
            setMapData(list);
        });
    }, []);

    useFocusEffect(useCallback(() => {
        makeRequest("vendors/active").then((result) => {
            if (!result.error) setActiveVendors(result.vendors ?? []);
        });
    }, []));

    const filteredMapData = useMemo(() => {
        if (!mapData) return [];

        return mapData.filter((resource) => {
            if (resource == null || typeof resource !== "object") return false;
            const name = resource.name ?? "";
            const categoryMatch = selectedCategory !== null ? resource.category === selectedCategory : true;

            let subcategoryMatch = true;
            if (subcategoryFilter && resource.category === selectedCategory) {
                subcategoryMatch = name.toLowerCase().includes(subcategoryFilter.toLowerCase());
            }

            return categoryMatch &&
                subcategoryMatch &&
                (idRequired ? !resource.id_required : true) &&
                (search !== ""
                    ? name.toLowerCase().includes(search.toLowerCase())
                    : true);
        });
    }, [selectedCategory, subcategoryFilter, idRequired, mapData, search, day, time]);

    const toggleFilter = (category: Categories) => {
        if (selectedCategory === category) {
            setSelectedCategory(null);
            setSubcategoryFilter(null);
        } else {
            setSelectedCategory(category);
            setSubcategoryFilter(null);
        }
    }

    const toggleSubcategory = (subcategory: string) => {
        if (subcategoryFilter === subcategory) {
            setSubcategoryFilter(null);
        }
        else {
            setSubcategoryFilter(subcategory);
        }
    }

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



    return (
        <View className="bg-[#F8F8F8] flex-1" style={{ paddingTop: insets.top, paddingBottom: insets.bottom - 10 }}>
            {
                filteredMapData === undefined ? (
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
                                        <TextInput onChangeText={(v) => onSearchChange(v)} className="text-[14px] font-lexend-medium text-[#00000059] ml-[6px] w-[85%]" placeholder="Search resources"></TextInput>
                                    </View>
                                </View>
                                {/* <Image source={require("../../assets/images/bell-pin.svg")} style={{ width: 37, height: 37, marginRight: 10 }} contentFit="contain" /> */}
                            </View>
                            <View className="flex flex-row justify-between items-center mt-[6px] mr-[10px]">
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
                            <TopPanel resources={filteredMapData} location={location} setAnimateTo={(longitude, latitude) => setAnimateTo({ longitude, latitude })}/>
                        </View>
                        <View>
                            {
                                showFilter && (
                                    <Animated.View
                                        entering={FadeIn.duration(300).easing(Easing.inOut(Easing.quad))}
                                        exiting={FadeOut.duration(300).easing(Easing.inOut(Easing.quad))}
                                        className="absolute top-0 left-0 right-0 z-30 bg-[#F8F8F8]"
                                        style={{ maxHeight: Dimensions.get("window").height * 0.65 }}
                                    >
                                        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 40, paddingBottom: 20 }}>
                                            <Text className="font-lexend-medium text-[14px]">Distance</Text>
                                            <Text className="font-lexend-medium text-[10px] text-[#767676]">Only show me resources within a specific distance</Text>
                                            <Slider
                                                style={{ width: "auto", height: 35 }}
                                                minimumValue={1}
                                                maximumValue={100}
                                                value={distance}
                                                step={1}
                                                onValueChange={(value) => onSliderChange(value)}
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
                                                <FilterButton title="ID Not Required" isPressed={idRequired} toggleOther={() => setIDRequired(v => !v)} width={145} height={35} />
                                            </View>
                                            <View className="mt-[7px] h-[26px] flex items-center flex-row">
                                                <Text className="font-lexend-medium text-[14px]">Category</Text>
                                            </View>
                                            <View className="flex flex-row justify-between items-center mt-[8px]">
                                                <FilterButton title="Urgent Needs" isPressed={selectedCategory === "Urgent Needs"} toggleFilter={toggleFilter} textSize={10} width={98} height={32} />
                                                <FilterButton title="Health and Wellness" isPressed={selectedCategory === "Health and Wellness"} toggleFilter={toggleFilter} textSize={8} width={98} height={32} />
                                                <FilterButton title="Family and Pets" isPressed={selectedCategory === "Family and Pets"} toggleFilter={toggleFilter} textSize={8} width={98} height={32} />
                                            </View>
                                            <View className="flex flex-row justify-left items-center mt-[7px] gap-[9px]">
                                                <FilterButton title="Specialized Assistance and Help" isPressed={selectedCategory === "Specialized Assistance and Help"} toggleFilter={toggleFilter} textSize={7} width={98} height={36} />
                                                <FilterButton title="Find Work" isPressed={selectedCategory === "Find Work"} toggleFilter={toggleFilter} textSize={7} width={98} height={36} />
                                                <FilterButton title="Get Help" isPressed={selectedCategory === "Get Help"} toggleFilter={toggleFilter} textSize={7} width={98} height={36} />
                                            </View>
                                            {selectedCategory !== null && CATEGORY_SUBCATEGORIES[selectedCategory] && (
                                                <View className="mt-[12px]">
                                                    <Text className="font-lexend-medium text-[14px] mb-[8px]">Subcategory</Text>
                                                    <Animated.View
                                                        entering={FadeIn.duration(200)}
                                                        exiting={FadeOut.duration(200)}
                                                        className="mb-[10px]"
                                                    >
                                                        <View className="flex flex-row flex-wrap" style={{ gap: 7 }}>
                                                            {CATEGORY_SUBCATEGORIES[selectedCategory].map((sub) => (
                                                                <FilterButton
                                                                    key={`${selectedCategory}-${sub}`}
                                                                    title={sub}
                                                                    isPressed={subcategoryFilter === sub}
                                                                    toggleOther={() => toggleSubcategory(sub)}
                                                                    textSize={9}
                                                                    width={98}
                                                                    height={28}
                                                                />
                                                            ))}
                                                        </View>
                                                    </Animated.View>
                                                </View>
                                            )}
                                        </ScrollView>
                                        </TouchableWithoutFeedback>
                                    </Animated.View>
                                )
                            }
                            <MapComponent mapData={filteredMapData} activeVendors={activeVendors} location={location} animateTo={animateTo}/>
                        </View>
                    </>
                )
            }
        </View>
    );
}

