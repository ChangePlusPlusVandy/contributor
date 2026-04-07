import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { useState } from "react";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { config } from "@/lib/env";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function ChangePassword() {

    const insets = useSafeAreaInsets();
    const router = useRouter();

    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [loading, setLoading] = useState(false);

    const buttonScale = useSharedValue(1);
    const buttonStyle = useAnimatedStyle(() => ({
        transform: [{ scale: buttonScale.value }],
    }));

    const handleChangePassword = async () => {
        if (!password || !confirm) {
            Alert.alert("Error", "Please fill in all fields.");
            return;
        }
        if (password !== confirm) {
            Alert.alert("Error", "Passwords do not match.");
            return;
        }
        if (password.length < 6) {
            Alert.alert("Error", "Password must be at least 6 characters.");
            return;
        }

        setLoading(true);
        try {
            const store = await SecureStore.getItemAsync("auth");
            if (!store) { Alert.alert("Error", "Not logged in."); return; }
            const auth = JSON.parse(store);

            const res = await fetch(`${config.API_URL}auth/change-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${auth.accessToken}` },
                body: JSON.stringify({ password }),
            });
            const data = await res.json();

            if (!res.ok) { Alert.alert("Error", data.detail || "Failed to change password."); return; }

            await SecureStore.setItemAsync("auth", JSON.stringify({
                role: auth.role,
                accessToken: data.access_token,
                refreshToken: data.refresh_token,
            }));

            Alert.alert("Success", "Password changed successfully.", [{ text: "OK", onPress: () => router.back() }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1, paddingTop: insets.top }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            <ScrollView keyboardShouldPersistTaps="handled">
                <View style={{ paddingBottom: insets.bottom + 100 }} className="px-[32px] pt-[24px] flex-1">
                    <View className="flex flex-row items-center mb-[28px]">
                        <Image
                            source={require("../../assets/images/logo-svg.svg")}
                            style={{ width: 42, height: 42, marginRight: 10 }}
                            contentFit="contain"
                        />
                        <Text className="font-lexend-bold text-[28px] text-[#2B84E9]">WTTIN</Text>
                    </View>

                    <Text className="font-lexend-semibold text-[20px] mb-[24px]">Change Password</Text>

                    <Text className="font-lexend-medium text-[14px] mb-[6px] opacity-60">New Password</Text>
                    <TextInput
                        value={password}
                        onChangeText={setPassword}
                        placeholder="Enter new password"
                        secureTextEntry
                        className="font-lexend-regular text-[16px] border border-gray-300 rounded-[8px] px-[14px] py-[12px] mb-[16px]"
                    />

                    <Text className="font-lexend-medium text-[14px] mb-[6px] opacity-60">Confirm Password</Text>
                    <TextInput
                        value={confirm}
                        onChangeText={setConfirm}
                        placeholder="Confirm new password"
                        secureTextEntry
                        className="font-lexend-regular text-[16px] border border-gray-300 rounded-[8px] px-[14px] py-[12px] mb-[28px]"
                    />

                    <AnimatedPressable
                        onPressIn={() => { buttonScale.value = withSpring(0.95, { stiffness: 900, damping: 90, mass: 6 }); }}
                        onPressOut={() => { buttonScale.value = withSpring(1, { stiffness: 900, damping: 90, mass: 6 }); }}
                        onPress={handleChangePassword}
                        disabled={loading}
                    >
                        <Animated.View
                            style={[buttonStyle, {
                                backgroundColor: "#F5C542",
                                borderRadius: 25,
                                paddingVertical: 14,
                                alignItems: "center",
                            }]}
                        >
                            <Text className="font-lexend-semibold text-[16px]" style={{ color: "#1a1a1a" }}>
                                Change Password
                            </Text>
                        </Animated.View>
                    </AnimatedPressable>

                    <Pressable onPress={() => router.back()} style={{ marginTop: 16, alignItems: "center" }}>
                        <Text className="font-lexend-medium text-[14px] text-[#2B84E9]">Back</Text>
                    </Pressable>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
