import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useBookmarks } from "@/providers/bookmarks";
import ResourceModal from "@/components/ResourceModal";
import * as Location from "expo-location";
import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useApi } from "@/lib/api";

export default function Bookmarks() {
    const { bookmarkedOrgNames } = useBookmarks();
    const { makeRequest } = useApi();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [resolvedResources, setResolvedResources] = useState<Resource[] | undefined>(undefined);

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

    useFocusEffect(
        useCallback(() => {
            if (bookmarkedOrgNames.length === 0) {
                setResolvedResources([]);
                return;
            }
            let cancelled = false;
            setResolvedResources(undefined);
            makeRequest("resources/", { method: "GET" }).then((result) => {
                if (cancelled) return;
                if (result.error != null) {
                    setResolvedResources([]);
                    return;
                }
                const raw = result.resources;
                const list = Array.isArray(raw)
                    ? raw.filter((r: unknown): r is Resource => r != null && typeof r === "object")
                    : [];
                const byName = new Map(list.map((r) => [r.org_name, r]));
                const ordered = bookmarkedOrgNames
                    .map((name) => byName.get(name))
                    .filter((r): r is Resource => r != null);
                setResolvedResources(ordered);
            });
            return () => {
                cancelled = true;
            };
        }, [bookmarkedOrgNames])
    );

    const isEmpty = bookmarkedOrgNames.length === 0;
    const isLoading = !isEmpty && resolvedResources === undefined;

    return (
        <View className="bg-[#F8F8F8] flex-1" style={{ paddingTop: insets.top }}>
            <View className="w-full flex justify-start items-center flex-row pb-[10px] mt-[7px] h-[45px]">
                <Image
                    source={require("../../assets/images/logo-svg.svg")}
                    style={{ width: 42, height: 42, marginLeft: 11, marginRight: 10 }}
                    contentFit="contain"
                />
                <View>
                    <Text className="font-lexend-semibold text-[18px]">WHERE TO TURN</Text>
                    <Text className="font-lexend-semibold text-[18px]">IN NASHVILLE</Text>
                </View>
            </View>
            <View className="mt-[10px]" />
            <View className="flex flex-row items-center px-[10px] mb-[12px]">
                <Pressable onPress={() => router.back()} hitSlop={12} className="p-[2px]">
                    <ChevronLeft size={24} color="#000" />
                </Pressable>
                <Text className="font-lexend-semibold text-[18px] ml-[4px]">Bookmarks</Text>
            </View>
            {isEmpty ? (
                <View className="flex-1 items-center justify-center px-[24px]">
                    <Text className="font-lexend-medium text-[14px] opacity-50 ml-[2px] text-center">
                        No bookmarks yet. Tap the bookmark icon on a resource to save it here.
                    </Text>
                </View>
            ) : isLoading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#2B84E9" />
                </View>
            ) : resolvedResources?.length === 0 ? (
                <View className="flex-1 items-center justify-center px-[24px]">
                    <Text className="font-lexend-medium text-[14px] opacity-50 ml-[2px] text-center">
                        Could not load bookmarked resources. Pull to refresh or try again later.
                    </Text>
                </View>
            ) : (
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 85, paddingHorizontal: 10 }}
                >
                    {resolvedResources!.map((resource, index) => (
                        <View
                            key={(resource as Resource & { _id?: string })._id ?? `bookmark-${index}-${resource.org_name}`}
                            className="mb-[12px]"
                        >
                            <ResourceModal
                                absolute={false}
                                modalResource={resource}
                                closeModalResource={() => {}}
                                location={location}
                            />
                        </View>
                    ))}
                </ScrollView>
            )}
        </View>
    );
}
