import { useSafeAreaInsets } from "react-native-safe-area-context";
import { View, Text, ScrollView, TextInput, Pressable, KeyboardAvoidingView, Platform } from "react-native";
import { Image } from "expo-image";
import { useCallback, useMemo, useState } from "react";
import { useAuth } from "@/providers/auth";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

type AnnouncementItem = {
    id: string;
    body: string;
    createdAt: number;
};

const PostButton = ({ onPress, disabled }: { onPress: () => void; disabled: boolean }) => {
    const scale = useSharedValue(1);
    const style = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    return (
        <Pressable
            onPress={onPress}
            disabled={disabled}
            onPressIn={() => {
                scale.value = withSpring(0.97, { stiffness: 900, damping: 90, mass: 6 });
            }}
            onPressOut={() => {
                scale.value = withSpring(1, { stiffness: 900, damping: 90, mass: 6 });
            }}
        >
            <Animated.View
                style={[
                    style,
                    {
                        opacity: disabled ? 0.45 : 1,
                        backgroundColor: "#2B84E9",
                        borderRadius: 10,
                        paddingVertical: 12,
                        alignItems: "center",
                    },
                ]}
            >
                <Text className="font-lexend-semibold text-[15px] text-white">Post</Text>
            </Animated.View>
        </Pressable>
    );
};

const AnnouncementCard = ({ item }: { item: AnnouncementItem }) => {
    const dateLabel = useMemo(() => {
        return new Date(item.createdAt).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    }, [item.createdAt]);

    return (
        <View
            className="bg-white rounded-[12px] px-[14px] py-[14px] mb-[12px]"
            style={{
                shadowColor: "#000",
                shadowOffset: { width: 2, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 4,
            }}
        >
            <Text className="font-lexend-medium text-[12px] opacity-50 mb-[8px]">{dateLabel}</Text>
            <Text className="font-lexend-medium text-[15px] leading-[22px]">{item.body}</Text>
        </View>
    );
};

const SEED_ANNOUNCEMENTS: AnnouncementItem[] = [
    {
        id: "seed-1",
        body: "Welcome to Where to Turn in Nashville. Check back here for updates on resources and community news.",
        createdAt: Date.now() - 86400000 * 2,
    },
];

export default function Announcements() {
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    const isAdmin = user?.role === "admin";
    const [announcements, setAnnouncements] = useState<AnnouncementItem[]>(SEED_ANNOUNCEMENTS);
    const [draft, setDraft] = useState("");

    const sorted = useMemo(
        () => [...announcements].sort((a, b) => b.createdAt - a.createdAt),
        [announcements]
    );

    const post = useCallback(() => {

    }, [draft]);

    const canPost = draft.trim().length > 0;

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
                {/* <Image
                    source={require("../../assets/images/bell-pin.svg")}
                    style={{ width: 37, height: 37, marginLeft: "auto", marginRight: 10 }}
                    contentFit="contain"
                /> */}
            </View>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                className="flex-1"
                keyboardVerticalOffset={0}
            >
                <View className="mt-[10px]"></View>
                <ScrollView
                    contentContainerStyle={{ paddingBottom: 85, paddingHorizontal: 10 }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {isAdmin && (
                        <View className="mb-[20px]">
                            <Text className="font-lexend-semibold text-[18px] mb-[10px] ml-[2px]">New announcement</Text>
                            <View
                                className="bg-white rounded-[12px] px-[14px] py-[12px]"
                                style={{
                                    shadowColor: "#000",
                                    shadowOffset: { width: 2, height: 2 },
                                    shadowOpacity: 0.1,
                                    shadowRadius: 4,
                                    elevation: 4,
                                }}
                            >
                                <TextInput
                                    value={draft}
                                    onChangeText={setDraft}
                                    placeholder="Write an announcement for the community…"
                                    placeholderTextColor="rgba(0,0,0,0.35)"
                                    multiline
                                    textAlignVertical="top"
                                    className="font-lexend-medium text-[15px] min-h-[100px]"
                                    style={{ minHeight: 100 }}
                                />
                                <View className="mt-[12px]">
                                    <PostButton onPress={post} disabled={!canPost} />
                                </View>
                            </View>
                        </View>
                    )}
                    <Text className="font-lexend-semibold text-[18px] mb-[12px] ml-[2px]">Announcements</Text>
                    {sorted.length === 0 ? (
                        <Text className="font-lexend-medium text-[14px] opacity-50 ml-[2px]">No announcements yet.</Text>
                    ) : (
                        sorted.map((item) => <AnnouncementCard key={item.id} item={item} />)
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}
