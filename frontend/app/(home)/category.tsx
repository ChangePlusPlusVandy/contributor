import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import * as Location from "expo-location";
import ResourceModal from "@/components/ResourceModal";
import { ChevronLeft } from "lucide-react-native";
import { useApi } from "@/lib/api";

export default function Category() {
    const { title, filter } = useLocalSearchParams<{ title: string; filter: string }>();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [location, setLocation] = useState<Location.LocationObject | null>(null);

    useFocusEffect(
        useCallback(() => {
            async function getCurrentLocation() {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== "granted") return;
                const loc = await Location.getCurrentPositionAsync({});
                setLocation(loc);
            }
            getCurrentLocation();
        }, [])
    );

    const { makeRequest } = useApi();

    const [resources, setResources] = useState<Resource[] | undefined>(undefined);
    useEffect(() => {
        makeRequest("resources/", {
            method: "GET"
        }).then((result) => {
            if (result.error != null) {
                setResources([]);
                return;
            }
            const raw = result.resources;
            const list = Array.isArray(raw)
                ? raw.filter((r: unknown): r is Resource => r != null && typeof r === "object")
                : [];
            setResources(list.filter((r: Resource) => r.subcategory === title));
        });
    }, [filter]);

    return (
        <View className="bg-[#F8F8F8] flex-1" style={{ paddingTop: insets.top }}>
            <View className="w-full flex justify-start items-center flex-row pb-[10px] mt-[7px] h-[45px]">
                <Image source={require("../../assets/images/logo-svg.svg")} style={{ width: 42, height: 42, marginLeft: 11, marginRight: 10 }} contentFit="contain" />
                <View>
                    <Text className="font-lexend-semibold text-[18px]">WHERE TO TURN</Text>
                    <Text className="font-lexend-semibold text-[18px]">IN NASHVILLE</Text>
                </View>
                {/* <Image source={require("../../assets/images/bell-pin.svg")} style={{ width: 37, height: 37, marginLeft: "auto", marginRight: 10 }} contentFit="contain" /> */}
            </View>
            <View className="mt-[10px]" />
            <View className="flex flex-row items-center px-[10px] mb-[12px]">
                <Pressable onPress={() => router.back()} hitSlop={12} className="p-[2px]">
                    <ChevronLeft size={24} color="#000" />
                </Pressable>
                <Text className="font-lexend-semibold text-[18px] ml-[4px]">{title}</Text>
            </View>
            {resources === undefined ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="black" />
                </View>
            ) : resources?.length === 0 ? (
                <View className="flex-1 items-center justify-center px-[24px]">
                    <Text className="font-lexend-medium text-[14px] opacity-50 ml-[2px] text-center">
                        No resources found for this category.
                    </Text>
                </View>
            ) : (
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 85, paddingHorizontal: 10 }}
                >
                    {resources?.map((resource: Resource, index) => (
                        <View
                            key={(resource as Resource & { _id?: string })._id ?? `category-resource-${index}`}
                            className="mb-[12px]"
                        >
                            <ResourceModal
                                absolute={false}
                                modalResource={resource}
                                closeModalResource={() => { }}
                                location={location}
                            />
                        </View>
                    ))}
                </ScrollView>
            )}
        </View>
    );
}
