import PageLayout from "@/components/PageLayout";
import { Pressable, Text, View } from "react-native";
import { UserRoundCheck, UserRoundPen, Book } from 'lucide-react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

const links: MoreLink[] = [
    {
        title: "Vendor Login",
        subtitle: "Login here with a verified vendor account.",
        icon: <UserRoundCheck color="black" size={40}/>
    },
    {
        title: "Vendor Registration",
        subtitle: "Register a vendor account.",
        icon: <UserRoundPen color="black" size={40} />
    },
    {
        title: "Request Printed Guide",
        subtitle: "Request a printed guide to be sent to you.",
        icon: <Book color="black" size={40} />
    },
]

function MoreLink({ item }: { item: MoreLink }) {


    const scale = useSharedValue(1);
    const scaleStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }]
    }))


    return (
        <Animated.View className="mb-4" style={[scaleStyle]} >
            <Pressable className="w-full h-[100px] p-6 flex flex-row justify-start items-center gap-6 rounded-xl" onPressIn={() => scale.value = withSpring(0.9, { damping: 50, stiffness: 400, mass: 5 })} onPressOut={() => scale.value = withSpring(1)}>
                {item.icon}
                <View className="flex-col">
                    <Text className="text-2xl font-bold">{item.title}</Text>
                    <Text className="text-sm">{item.subtitle}</Text>
                </View>
            </Pressable>
        </Animated.View>
    );
}

export default function More() {
    return (
        <PageLayout title="More">
            <View className="px-5 pt-4">
                {
                    links.map((item, key) => {
                        return <MoreLink item={item} key={key}/>
                    })
                }
            </View>
        </PageLayout>
    );
}