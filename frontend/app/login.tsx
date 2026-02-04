import { View, Text, Pressable, TextInput, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "expo-router";
import { useApi } from "../lib/api";

export default function Login() {
  const { makeRequest } = useApi();
  const [vendorId, setVendorId] = useState("");
  const [vendorPass, setVendorPass] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPass, setAdminPass] = useState("");
  const { mode } = useSearchParams();

  const adminEmailRef = useRef<TextInput | null>(null);
  const vendorIdRef = useRef<TextInput | null>(null);

  useEffect(() => {
    if (mode === "admin") {
      setTimeout(() => adminEmailRef.current?.focus(), 100);
    } else if (mode === "vendor") {
      setTimeout(() => vendorIdRef.current?.focus(), 100);
    }
  }, [mode]);

  const loginAdmin = async () => {
    const res = await makeRequest("/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: adminEmail, password: adminPass }),
    });
    if ((res as any).error) {
      Alert.alert("Admin login failed", JSON.stringify(res));
      return;
    }
    Alert.alert("Admin logged in", JSON.stringify(res));
  };

  const loginVendor = async () => {
    const res = await makeRequest("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vendor_id: vendorId, password: vendorPass }),
    });
    if ((res as any).error) {
      Alert.alert("Vendor login failed", JSON.stringify(res));
      return;
    }
    Alert.alert("Vendor logged in", JSON.stringify(res));
  };

  return (
    <SafeAreaView className="flex-1 p-4 bg-white">
      <View className="mb-6">
        <Text className="text-xl font-bold mb-2">Admin Login</Text>
        <TextInput
          ref={adminEmailRef}
          placeholder="admin email"
          value={adminEmail}
          onChangeText={setAdminEmail}
          className="border p-2 mb-2"
          autoCapitalize="none"
        />
        <TextInput
          placeholder="password"
          value={adminPass}
          onChangeText={setAdminPass}
          secureTextEntry
          className="border p-2 mb-2"
        />
        <Pressable
          className="bg-blue-600 p-3 rounded"
          onPress={loginAdmin}
        >
          <Text className="text-white text-center">Login as Admin</Text>
        </Pressable>
      </View>

      <View>
        <Text className="text-xl font-bold mb-2">Vendor Login</Text>
        <TextInput
          ref={vendorIdRef}
          placeholder="vendor id"
          value={vendorId}
          onChangeText={setVendorId}
          className="border p-2 mb-2"
          autoCapitalize="none"
        />
        <TextInput
          placeholder="password"
          value={vendorPass}
          onChangeText={setVendorPass}
          secureTextEntry
          className="border p-2 mb-2"
        />
        <Pressable
          className="bg-green-600 p-3 rounded"
          onPress={loginVendor}
        >
          <Text className="text-white text-center">Login as Vendor</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
