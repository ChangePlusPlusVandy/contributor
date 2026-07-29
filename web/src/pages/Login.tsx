import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/providers/auth";
import logo from "@/assets/images/logo-svg.svg";

const API_URL = import.meta.env.VITE_API_URL || "";

export default function Login() {

    const { setUser } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const role = searchParams.get("role");

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const isAdmin = role === "admin";

    const saveAuthAndNavigate = (role: "admin" | "vendor", tokens: { access_token: string, refresh_token: string }, user: User) => {
        localStorage.setItem("auth", JSON.stringify({
            role,
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
        }));
        setUser(user);
        navigate(-1);
    };

    const handleLogin = async () => {
        if (!username || !password) {
            window.alert("Please fill in all fields.");
            return;
        }

        setLoading(true);
        try {
            if (isAdmin) {
                const res = await fetch(`${API_URL}admin/login`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: username, password }),
                });
                const data = await res.json();
                if (!res.ok) { window.alert(`Login Failed: ${data.detail || "Invalid credentials."}`); return; }
                saveAuthAndNavigate("admin", data, { email: data.admin.email, name: data.admin.name, role: "admin" });
            } else {
                // Vendor login intentionally sends the form's "username" as vendor_id.
                const res = await fetch(`${API_URL}auth/login`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ vendor_id: username, password }),
                });
                const data = await res.json();
                if (!res.ok) { window.alert(`Login Failed: ${data.detail || "Invalid credentials."}`); return; }
                saveAuthAndNavigate("vendor", data, { email: data.user.vendor_id, name: data.user.name, role: "vendor" });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-full bg-[#F8F8F8]">
            <form
                className="mx-auto flex max-w-[440px] flex-col px-[32px] pb-[100px] pt-[24px]"
                onSubmit={(e) => { e.preventDefault(); handleLogin(); }}
            >
                <div className="mb-[28px] flex flex-row items-center">
                    <img src={logo} alt="" className="mr-[10px] h-[42px] w-[42px] object-contain" />
                    <p className="font-lexend-bold text-[28px] text-[#2B84E9]">WTTIN</p>
                </div>

                <h1 className="font-lexend-semibold mb-[24px] text-[20px]">
                    {isAdmin ? "Admin Login" : "Vendor Login"}
                </h1>

                <label className="font-lexend-medium mb-[6px] text-[14px] opacity-60">{isAdmin ? "Username" : "4-Digit Pin"}</label>
                <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={isAdmin ? "Enter username" : "Enter pin"}
                    autoCapitalize="none"
                    autoCorrect="off"
                    inputMode={isAdmin ? "text" : "numeric"}
                    className="font-lexend-regular mb-[16px] rounded-[8px] border border-gray-300 bg-white px-[14px] py-[12px] text-[16px] outline-none"
                />

                <label className="font-lexend-medium mb-[6px] text-[14px] opacity-60">Password</label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="font-lexend-regular mb-[28px] rounded-[8px] border border-gray-300 bg-white px-[14px] py-[12px] text-[16px] outline-none"
                />

                <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center justify-center rounded-[25px] py-[14px] transition-transform duration-150 active:scale-95"
                    style={{ backgroundColor: isAdmin ? "#1a1a1a" : "#F5C542" }}
                >
                    {
                        loading ?
                            <Loader2 className="animate-spin" color={isAdmin ? "#ffffff" : "#1a1a1a"} />
                            :
                            <span className="font-lexend-semibold text-[16px]" style={{ color: isAdmin ? "#fff" : "#1a1a1a" }}>
                                {isAdmin ? "Sign in as Admin" : "Sign in as Vendor"}
                            </span>
                    }
                </button>

                <button type="button" onClick={() => navigate(-1)} className="mt-[16px] text-center">
                    <span className="font-lexend-medium text-[14px] text-[#2B84E9]">Back</span>
                </button>
            </form>
        </div>
    );
}
