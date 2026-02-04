import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, TouchableOpacity, TextInput } from "react-native";
import { useState } from "react";
import { useApi } from "../../lib/api";

export default function More() {
    const { makeRequest } = useApi();

    const [showAdmin, setShowAdmin] = useState(false);
    const [showVendor, setShowVendor] = useState(false);

    const [adminEmail, setAdminEmail] = useState("");
    const [adminPass, setAdminPass] = useState("");
    const [adminMessage, setAdminMessage] = useState("");
    const [adminMessageColor, setAdminMessageColor] = useState("#dc2626");

    const [vendorId, setVendorId] = useState("");
    const [vendorPass, setVendorPass] = useState("");
    const [vendorMessage, setVendorMessage] = useState("");
    const [vendorMessageColor, setVendorMessageColor] = useState("#dc2626");
    const [vendorSetPasswordMode, setVendorSetPasswordMode] = useState(false);
    const [vendorNewPassword, setVendorNewPassword] = useState("");

    const loginAdmin = async () => {
        try {
            setAdminMessage("");
            const res = await makeRequest("/admin/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: adminEmail, password: adminPass }),
            });
            if ((res as any).error) {
                const msg = (res as any).error || (res as any).detail || JSON.stringify(res);
                setAdminMessage(msg);
                setAdminMessageColor("#dc2626");
            } else if ((res as any).access_token) {
                setAdminMessage("Successfully logged in");
                setAdminMessageColor("#16a34a");
                setAdminPass("");
            } else {
                const msg = JSON.stringify(res);
                setAdminMessage(msg);
                setAdminMessageColor("#dc2626");
            }
        } catch (e) {
            setAdminMessage(String(e));
            setAdminMessageColor("#dc2626");
        }
    };

    const loginVendor = async () => {
        try {
            setVendorMessage("");
            const res = await makeRequest("/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ vendor_id: vendorId, password: vendorPass }),
            });
            if ((res as any).error) {
                const msg = (res as any).error || (res as any).detail || JSON.stringify(res);
                setVendorMessage(msg);
                setVendorMessageColor("#dc2626");
            } else if ((res as any).password_required) {
                setVendorMessage("Password required — set your password below");
                setVendorMessageColor("#dc2626");
                setVendorSetPasswordMode(true);
                setVendorNewPassword("");
            } else if ((res as any).access_token) {
                setVendorMessage("Successfully logged in");
                setVendorMessageColor("#16a34a");
                setVendorPass("");
                setVendorSetPasswordMode(false);
            } else {
                setVendorMessage(JSON.stringify(res));
                setVendorMessageColor("#dc2626");
            }
        } catch (e) {
            setVendorMessage(String(e));
            setVendorMessageColor("#dc2626");
        }
    };

    const submitVendorSetPassword = async () => {
        try {
            setVendorMessage("");
            const res = await makeRequest("/auth/set-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ vendor_id: vendorId, password: vendorNewPassword }),
            });
            if ((res as any).error) {
                const msg = (res as any).error || (res as any).detail || JSON.stringify(res);
                setVendorMessage(msg);
                setVendorMessageColor("#dc2626");
            } else if ((res as any).access_token) {
                setVendorMessage("Password set and logged in");
                setVendorMessageColor("#16a34a");
                setVendorSetPasswordMode(false);
                setVendorPass("");
                setVendorNewPassword("");
            } else {
                setVendorMessage(JSON.stringify(res));
                setVendorMessageColor("#dc2626");
            }
        } catch (e) {
            setVendorMessage(String(e));
            setVendorMessageColor("#dc2626");
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, padding: 16, backgroundColor: '#ffffff' }}>
            <View>
                <Text style={{ fontSize: 20, fontWeight: '700', marginBottom: 12 }}>More</Text>

                <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Login as Admin"
                    testID="login-admin-btn"
                    activeOpacity={0.8}
                    style={{ backgroundColor: '#2563eb', padding: 12, borderRadius: 8, marginBottom: 12 }}
                    onPress={() => setShowAdmin((s) => !s)}
                >
                    <Text style={{ color: '#fff', textAlign: 'center' }}>Login as Admin</Text>
                </TouchableOpacity>

                {showAdmin ? (
                    <View style={{ marginBottom: 16 }}>
                        <TextInput
                            placeholder="admin email"
                            value={adminEmail}
                            onChangeText={setAdminEmail}
                            autoCapitalize="none"
                            style={{ borderWidth: 1, borderColor: '#ddd', padding: 8, marginBottom: 8, borderRadius: 6 }}
                        />
                        <TextInput
                            placeholder="password"
                            value={adminPass}
                            onChangeText={setAdminPass}
                            secureTextEntry
                            style={{ borderWidth: 1, borderColor: '#ddd', padding: 8, marginBottom: 8, borderRadius: 6 }}
                        />
                        <TouchableOpacity
                            style={{ backgroundColor: '#1d4ed8', padding: 10, borderRadius: 6 }}
                            onPress={loginAdmin}
                        >
                            <Text style={{ color: '#fff', textAlign: 'center' }}>Submit Admin Login</Text>
                        </TouchableOpacity>
                        {adminMessage ? (
                            <Text style={{ color: adminMessageColor, marginTop: 8 }}>{adminMessage}</Text>
                        ) : null}
                    </View>
                ) : null}

                <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Login as Vendor"
                    testID="login-vendor-btn"
                    activeOpacity={0.8}
                    style={{ backgroundColor: '#059669', padding: 12, borderRadius: 8 }}
                    onPress={() => setShowVendor((s) => !s)}
                >
                    <Text style={{ color: '#fff', textAlign: 'center' }}>Login as Vendor</Text>
                </TouchableOpacity>

                {showVendor ? (
                    <View style={{ marginTop: 12 }}>
                        <TextInput
                            placeholder="vendor id"
                            value={vendorId}
                            onChangeText={setVendorId}
                            autoCapitalize="none"
                            style={{ borderWidth: 1, borderColor: '#ddd', padding: 8, marginBottom: 8, borderRadius: 6 }}
                        />
                        <TextInput
                            placeholder="password"
                            value={vendorPass}
                            onChangeText={setVendorPass}
                            secureTextEntry
                            style={{ borderWidth: 1, borderColor: '#ddd', padding: 8, marginBottom: 8, borderRadius: 6 }}
                        />
                        <TouchableOpacity
                            style={{ backgroundColor: '#047857', padding: 10, borderRadius: 6 }}
                            onPress={loginVendor}
                        >
                            <Text style={{ color: '#fff', textAlign: 'center' }}>Submit Vendor Login</Text>
                        </TouchableOpacity>
                        {vendorSetPasswordMode ? (
                            <View style={{ marginTop: 12 }}>
                                <TextInput
                                    placeholder="Set new password"
                                    value={vendorNewPassword}
                                    onChangeText={setVendorNewPassword}
                                    secureTextEntry
                                    style={{ borderWidth: 1, borderColor: '#ddd', padding: 8, marginBottom: 8, borderRadius: 6 }}
                                />
                                <TouchableOpacity
                                    style={{ backgroundColor: '#065f46', padding: 10, borderRadius: 6 }}
                                    onPress={submitVendorSetPassword}
                                >
                                    <Text style={{ color: '#fff', textAlign: 'center' }}>Set Password & Login</Text>
                                </TouchableOpacity>
                            </View>
                        ) : null}
                        {vendorMessage ? (
                            <Text style={{ color: vendorMessageColor, marginTop: 8 }}>{vendorMessage}</Text>
                        ) : null}
                    </View>
                ) : null}
            </View>
        </SafeAreaView>
    );
}