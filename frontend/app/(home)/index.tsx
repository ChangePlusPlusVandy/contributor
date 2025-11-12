import { useApi } from "@/lib/api";
import { useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Image } from "expo-image";
import { URGENT_NEEDS_RESOURCES, HEALTH_WELLNESS_RESOURCES, FAMILY_PETS_RESOURCES, SPECIALIZED_RESOURCES, GET_HELP_RESOURCES, FIND_WORK_RESOURCES } from "@/constants/resources";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

const Resource = ({ resource }: { resource: Resource} ) => {

    const scale = useSharedValue<number>(1);
    const style = useAnimatedStyle(() => (
        {
            transform: [{ scale: scale.value }]
        }
    ));

    return (
        <Pressable onPressIn={() => scale.value = withSpring(0.9, { stiffness: 900, damping: 90, mass: 6 })} onPressOut={() => scale.value = withSpring(1, { stiffness: 900, damping: 90, mass: 6 })}>
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

    return (
        <View className="ml-[10px] mb-[36px]">
            <Text className="font-lexend-semibold text-[18px] mb-[12px]">{title}</Text>
            <ScrollView
                horizontal
                contentContainerStyle={{ flexDirection: "row", alignItems: "center" }}
                showsHorizontalScrollIndicator={false}
                style={{ overflow: "visible" }}
            >   
                {
                    resources?.map((resource, key) => (
                        <Resource resource={resource} key={key}/>
                    ))
                }
            </ScrollView>
        </View>
    );

}


export default function Home() {

    return (
        <SafeAreaView className="bg-[#F8F8F8]">
            <View className="w-full flex justify-start items-center flex-row pb-[10px] mt-[7px] h-[45px]">
                <Image source={require("../../assets/images/logo-svg.svg")} style={{ width: 42, height: 42, marginLeft: 11, marginRight: 10 }} contentFit="contain"/>
                <View>
                    <Text className="font-lexend-semibold text-[18px]">WHERE TO TURN</Text>
                    <Text className="font-lexend-semibold text-[18px]">IN NASHVILLE</Text>
                </View>
                <Image source={require("../../assets/images/bell-pin.svg")} style={{ width: 37, height: 37, marginLeft: "auto", marginRight: 10 }} contentFit="contain" />
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