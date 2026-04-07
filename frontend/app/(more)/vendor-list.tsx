import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { Pressable } from "react-native";
import { useAuthApi } from "@/lib/api";

type Vendor = {
    vendor_id: string;
    name: string;
    is_clocked_in?: boolean;
};

export default function VendorList() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { makeRequest } = useAuthApi();
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        makeRequest("admin/vendors").then(data => {
            if (!data.error) {
                const sorted = (data.vendors ?? []).sort((a: Vendor, b: Vendor) =>
                    (b.is_clocked_in ? 1 : 0) - (a.is_clocked_in ? 1 : 0)
                );
                setVendors(sorted);
            }
            setLoading(false);
        });
    }, []);

    return (
        <View style={{ flex: 1, paddingTop: insets.top }}>
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

            <View className="px-[24px] pt-[16px] flex-1">
                <View className="flex-row items-center justify-between mb-[16px]">
                    <Text className="font-lexend-semibold text-[18px]">Vendors</Text>
                    <Pressable onPress={() => router.back()}>
                        <Text className="font-lexend-medium text-[14px] text-[#2B84E9]">Back</Text>
                    </Pressable>
                </View>

                {loading ? (
                    <ActivityIndicator />
                ) : vendors.length === 0 ? (
                    <Text className="font-lexend-medium text-[14px] opacity-50">No vendors found.</Text>
                ) : (
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}>
                        {vendors.map(vendor => (
                            <View
                                key={vendor.vendor_id}
                                className="bg-white rounded-[10px] px-[16px] py-[14px] mb-[10px] flex-row items-center justify-between"
                                style={{
                                    shadowColor: "#000",
                                    shadowOffset: { width: 2, height: 2 },
                                    shadowOpacity: 0.1,
                                    shadowRadius: 4,
                                    elevation: 4,
                                }}
                            >
                                <View>
                                    <Text className="font-lexend-semibold text-[15px]">{vendor.name}</Text>
                                    <Text className="font-lexend-medium text-[12px] opacity-50 mt-[2px]">ID: {vendor.vendor_id}</Text>
                                </View>
                                <View
                                    className="rounded-full px-[10px] py-[4px]"
                                    style={{ backgroundColor: vendor.is_clocked_in ? "#dcfce7" : "#f1f5f9" }}
                                >
                                    <Text
                                        className="font-lexend-medium text-[12px]"
                                        style={{ color: vendor.is_clocked_in ? "#16a34a" : "#64748b" }}
                                    >
                                        {vendor.is_clocked_in ? "Clocked In" : "Clocked Out"}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </ScrollView>
                )}
            </View>
        </View>
    );
}
