import { SafeAreaView } from "react-native-safe-area-context";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Image } from "expo-image";
import { URGENT_NEEDS_RESOURCES, HEALTH_WELLNESS_RESOURCES, FAMILY_PETS_RESOURCES, SPECIALIZED_RESOURCES, GET_HELP_RESOURCES, FIND_WORK_RESOURCES } from "@/constants/resources";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { useAuth } from "@/providers/auth";
import { router, useRouter } from "expo-router";
import { Bookmark } from "lucide-react-native";
import { useAuthApi } from "@/lib/api";
import { useEffect, useState } from "react";

const SECTION_TO_CATEGORY: Record<string, Categories> = {
    "Urgent Needs": "Urgent Needs",
    "Health & Wellness": "Health and Wellness",
    "Family & Pets": "Family and Pets",
    "Specialized Assistance": "Specialized Assistance and Help",
    "Get Help": "Specialized Assistance and Help",
    "Find Work": "Find Work",
};

const Resource = ({ resource, onPress }: { resource: any; onPress?: () => void }) => {

    const scale = useSharedValue<number>(1);
    const style = useAnimatedStyle(() => (
        {
            transform: [{ scale: scale.value }]
        }
    ));

    return (
        <Pressable
            onPress={onPress}
            onPressIn={() => scale.value = withSpring(0.9, { stiffness: 900, damping: 90, mass: 6 })}
            onPressOut={() => scale.value = withSpring(1, { stiffness: 900, damping: 90, mass: 6 })}
        >
            <Animated.View
                className="w-[100px] h-[100px] rounded-[12px] bg-white flex justify-start items-center mr-[10px]"
                style={[
                    {
                        shadowColor: "#000",
                        shadowOffset: { width: 2, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 4,
                        elevation: 4
                    },
                    style
                ]}
            >
                <Image source={resource.imageURL} style={{ width: 70, height: 70 }} contentFit="contain" />
                <Text className="font-lexend-medium text-[10px] text-center" style={{ lineHeight: 12 }}>{resource.name}</Text>
            </Animated.View>
        </Pressable>

    );

}

const ResourceSection = ({ title, resources }: { title: string, resources: Resource[] | undefined }) => {

    const { user } = useAuth();
    const router = useRouter();
    const categoryFilter = SECTION_TO_CATEGORY[title] ?? title;

    const navigateToCategory = (_title: string) => {
        router.push({ pathname: "/(home)/category", params: { title: _title, filter: categoryFilter } });
    };

    return (
        <View className="ml-[10px] mb-[36px]">
            <Pressable>
                <View className="flex w-full justify-between items-center flex-row">
                    <Text className="font-lexend-semibold text-[18px] mb-[12px]">{title}</Text>
                </View>
            </Pressable>
            <ScrollView
                horizontal
                contentContainerStyle={{ flexDirection: "row", alignItems: "center" }}
                showsHorizontalScrollIndicator={false}
                style={{ overflow: "visible" }}
            >   
                {
                    resources?.map((resource, key) => (
                        <Resource resource={resource} key={key} onPress={() => navigateToCategory(resource.name)}/>
                    ))
                }
            </ScrollView>
        </View>
    );

}

const BookmarksLink = () => {
    const router = useRouter();
    const scale = useSharedValue(1);
    const animStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    return (
        <Pressable
            onPress={() => router.push("/(home)/bookmarks")}
            onPressIn={() => scale.value = withSpring(0.97, { stiffness: 900, damping: 90, mass: 6 })}
            onPressOut={() => scale.value = withSpring(1, { stiffness: 900, damping: 90, mass: 6 })}
            className="mx-[10px] mb-[20px]"
        >
            <Animated.View
                className="h-[56px] rounded-[12px] bg-white flex flex-row items-center px-[10px]"
                style={[
                    {
                        shadowColor: "#000",
                        shadowOffset: { width: 2, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 4,
                        elevation: 4,
                    },
                    animStyle,
                ]}
            >
                <Text className="font-lexend-semibold text-[15px] text-[#2B84E9] ml-[10px]">Bookmarks</Text>
            </Animated.View>
        </Pressable>
    );
};

const UserHome = () => {
    return (
        <SafeAreaView className="bg-[#F8F8F8]">
            <View className="w-full flex justify-start items-center flex-row pb-[10px] mt-[7px] h-[45px]">
                <Image source={require("../../assets/images/logo-svg.svg")} style={{ width: 42, height: 42, marginLeft: 11, marginRight: 10 }} contentFit="contain" />
                <View>
                    <Text className="font-lexend-semibold text-[18px]">WHERE TO TURN</Text>
                    <Text className="font-lexend-semibold text-[18px]">IN NASHVILLE</Text>
                </View>
                {/* <Image source={require("../../assets/images/bell-pin.svg")} style={{ width: 37, height: 37, marginLeft: "auto", marginRight: 10 }} contentFit="contain" /> */}
            </View>
            <ScrollView
                contentContainerStyle={{ paddingBottom: 85 }}
                showsVerticalScrollIndicator={false}
            >
                <View className="w-full h-[100px] flex justify-start items-center flex-row mb-1.5 mt-1.5">
                    <View className="ml-[10px]">
                        <Text className="font-lexend-bold text-[29px] text-[#2B84E9]">Middle Tennesse</Text>
                        <Text className="font-lexend-bold text-[29px] text-[#2B84E9] -mt-1">Resource Directory</Text>
                    </View>
                </View>
                <BookmarksLink />
                <ResourceSection title="Urgent Needs" resources={URGENT_NEEDS_RESOURCES} />
                <ResourceSection title="Health & Wellness" resources={HEALTH_WELLNESS_RESOURCES} />
                <ResourceSection title="Family & Pets" resources={FAMILY_PETS_RESOURCES} />
                <ResourceSection title="Specialized Assistance" resources={SPECIALIZED_RESOURCES} />
                <ResourceSection title="Get Help" resources={GET_HELP_RESOURCES} />
                <ResourceSection title="Find Work & Get Connected" resources={FIND_WORK_RESOURCES} />
            </ScrollView>
        </SafeAreaView>
    );
}

const AdminHome = () => {

    const { user } = useAuth();
    const isAdmin = user && user.role == "admin";

    const { makeRequest } = useAuthApi();
    const [numPendingResources, setNumPendingResources] = useState<number>(0);

    const fetchPending = async () => {
        const result = await makeRequest("resources/pending/");
        if (result.resources) setNumPendingResources(result.resources.length);
    };

    useEffect(() => {
        fetchPending();
    }, [])

    return (
        <SafeAreaView className="bg-[#F8F8F8]">
            <View className="w-full flex justify-start items-center flex-row pb-[10px] mt-[7px] h-[45px]">
                <Image source={require("../../assets/images/logo-svg.svg")} style={{ width: 42, height: 42, marginLeft: 11, marginRight: 10 }} contentFit="contain" />
                <View>
                    <Text className="font-lexend-semibold text-[18px]">WHERE TO TURN</Text>
                    <Text className="font-lexend-semibold text-[18px]">IN NASHVILLE</Text>
                </View>
                {/* <Image source={require("../../assets/images/bell-pin.svg")} style={{ width: 37, height: 37, marginLeft: "auto", marginRight: 10 }} contentFit="contain" /> */}
            </View>
            <ScrollView
                contentContainerStyle={{ paddingBottom: 85 }}
                showsVerticalScrollIndicator={false}
            >
                <View className="p-[10px] flex flex-row flex-wrap gap-3 truncate">
                    <Text className="text-[29px] font-lexend-bold">Welcome Back,</Text> 
                    <Text className="text-[29px] font-lexend-bold text-[#2B84E9]">{user?.name}</Text>
                </View>
                <Pressable onPress={() => router.push("/(more)/more")}>
                    <View className="mx-2 mt-[5px] mb-[20px] h-[66px] shadow-sm bg-white rounded-[20px] flex justify-center px-4">
                        <Text className="text-[17px] font-lexend-medium">You have <Text className="text-[#2B84E9]">{numPendingResources}</Text> new resources awaitng for approval</Text>
                    </View>
                </Pressable>
                <BookmarksLink />
                <ResourceSection title="Urgent Needs" resources={URGENT_NEEDS_RESOURCES} />
                <ResourceSection title="Health & Wellness" resources={HEALTH_WELLNESS_RESOURCES} />
                <ResourceSection title="Family & Pets" resources={FAMILY_PETS_RESOURCES} />
                <ResourceSection title="Specialized Assistance" resources={SPECIALIZED_RESOURCES} />
                <ResourceSection title="Get Help" resources={GET_HELP_RESOURCES} />
                <ResourceSection title="Find Work & Get Connected" resources={FIND_WORK_RESOURCES} />
            </ScrollView>
        </SafeAreaView>
    );
}

const VendorHome = () => {
    return (
        <SafeAreaView className="bg-[#F8F8F8]">
            <View className="w-full flex justify-start items-center flex-row pb-[10px] mt-[7px] h-[45px]">
                <Image source={require("../../assets/images/logo-svg.svg")} style={{ width: 42, height: 42, marginLeft: 11, marginRight: 10 }} contentFit="contain" />
                <View>
                    <Text className="font-lexend-semibold text-[18px]">WHERE TO TURN</Text>
                    <Text className="font-lexend-semibold text-[18px]">IN NASHVILLE</Text>
                </View>
                {/* <Image source={require("../../assets/images/bell-pin.svg")} style={{ width: 37, height: 37, marginLeft: "auto", marginRight: 10 }} contentFit="contain" /> */}
            </View>
            <ScrollView
                contentContainerStyle={{ paddingBottom: 85 }}
                showsVerticalScrollIndicator={false}
            >
                <View className="w-full h-[100px] flex justify-start items-center flex-row mb-3 mt-1.5">
                    <View className="ml-[10px]">
                        <Text className="font-lexend-bold text-[29px] text-[#2B84E9]">Middle Tennesse</Text>
                        <Text className="font-lexend-bold text-[29px] text-[#2B84E9] -mt-1">Resource Directory</Text>
                    </View>
                </View>
                <BookmarksLink />
                <ResourceSection title="Urgent Needs" resources={URGENT_NEEDS_RESOURCES} />
                <ResourceSection title="Health & Wellness" resources={HEALTH_WELLNESS_RESOURCES} />
                <ResourceSection title="Family & Pets" resources={FAMILY_PETS_RESOURCES} />
                <ResourceSection title="Specialized Assistance" resources={SPECIALIZED_RESOURCES} />
                <ResourceSection title="Get Help" resources={GET_HELP_RESOURCES} />
                <ResourceSection title="Find Work & Get Connected" resources={FIND_WORK_RESOURCES} />
            </ScrollView>
        </SafeAreaView>
    );
}

export default function Home() {

    const { user } = useAuth();

    if (user?.role === "admin") return <AdminHome />;
    if (user?.role === "vendor") return <VendorHome />;
    return <UserHome />;

}