import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { useState } from "react";
import { useAuth } from "@/providers/auth";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { config } from "@/lib/env";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function Login() {

    const { setUser } = useAuth();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { role } = useLocalSearchParams<{ role: string }>();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const buttonScale = useSharedValue(1);
    const buttonStyle = useAnimatedStyle(() => ({
        transform: [{ scale: buttonScale.value }],
    }));

    const isAdmin = role === "admin";

    const saveAuthAndNavigate = async (role: "admin" | "vendor", tokens: { access_token: string, refresh_token: string }, user: User) => {
        await SecureStore.setItemAsync("auth", JSON.stringify({
            role,
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
        }));
        setUser(user);
        router.back();
    };

    const handleLogin = async () => {
        if (!username || !password) {
            Alert.alert("Error", "Please fill in all fields.");
            return;
        }

        setLoading(true);
        try {
            if (isAdmin) {
                const res = await fetch(`${config.API_URL}admin/login`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: username, password }),
                });
                const data = await res.json();
                if (!res.ok) { Alert.alert("Login Failed", data.detail || "Invalid credentials."); return; }
                await saveAuthAndNavigate("admin", data, { email: data.admin.email, name: data.admin.name, role: "admin" });
            } else {
                const res = await fetch(`${config.API_URL}auth/login`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ vendor_id: username, password }),
                });
                const data = await res.json();
                if (!res.ok) { Alert.alert("Login Failed", data.detail || "Invalid credentials."); return; }
                await saveAuthAndNavigate("vendor", data, { email: data.user.vendor_id, name: data.user.name, role: "vendor" });
            }
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

                    <Text className="font-lexend-semibold text-[20px] mb-[24px]">
                        {isAdmin ? "Admin Login" : "Vendor Login"}
                    </Text>

                    <Text className="font-lexend-medium text-[14px] mb-[6px] opacity-60">{isAdmin ? "Username" : "4-Digit Pin"}</Text>
                    <TextInput
                        value={username}
                        onChangeText={setUsername}
                        placeholder={isAdmin ? "Enter username" : "Enter pin"}
                        autoCapitalize="none"
                        autoCorrect={false}
                        keyboardType={isAdmin ? "default" : "numeric"}
                        className="font-lexend-regular text-[16px] border border-gray-300 rounded-[8px] px-[14px] py-[12px] mb-[16px]"
                    />

                    <Text className="font-lexend-medium text-[14px] mb-[6px] opacity-60">Password</Text>
                    <TextInput
                        value={password}
                        onChangeText={setPassword}
                        placeholder="Enter password"
                        secureTextEntry
                        className="font-lexend-regular text-[16px] border border-gray-300 rounded-[8px] px-[14px] py-[12px] mb-[28px]"
                    />

                    <AnimatedPressable
                        onPressIn={() => { buttonScale.value = withSpring(0.95, { stiffness: 900, damping: 90, mass: 6 }); }}
                        onPressOut={() => { buttonScale.value = withSpring(1, { stiffness: 900, damping: 90, mass: 6 }); }}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        <Animated.View
                            style={[buttonStyle, {
                                backgroundColor: isAdmin ? "#1a1a1a" : "#F5C542",
                                borderRadius: 25,
                                paddingVertical: 14,
                                alignItems: "center",
                            }]}
                        >
                            <Text
                                className="font-lexend-semibold text-[16px]"
                                style={{ color: isAdmin ? "#fff" : "#1a1a1a" }}
                            >
                                {
                                    loading ?
                                    <ActivityIndicator color="white"/>
                                    :
                                    <>
                                        {isAdmin ? "Sign in as Admin" : "Sign in as Vendor"}
                                    </>
                                }
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
