import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthApi } from "@/lib/api";
import { useAuth } from "@/providers/auth";
import logo from "@/assets/images/logo-svg.svg";

export default function ChangePassword() {

    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const role = searchParams.get("role");
    const { makeRequest } = useAuthApi();
    const { user } = useAuth();

    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChangePassword = async () => {
        if (!password || !confirm) {
            window.alert("Please fill in all fields.");
            return;
        }
        if (password !== confirm) {
            window.alert("Passwords do not match.");
            return;
        }
        if (password.length < 6) {
            window.alert("Password must be at least 6 characters.");
            return;
        }

        setLoading(true);
        try {
            const endpoint = role === "admin" ? "admin/change-password" : "auth/change-password";
            const data = await makeRequest(endpoint, { method: "POST", body: JSON.stringify({ password }) });
            if (data.error) { window.alert(`Error: ${data.error}`); return; }

            localStorage.setItem("auth", JSON.stringify({
                role: user!.role,
                accessToken: data.access_token,
                refreshToken: data.refresh_token,
            }));

            window.alert("Password changed successfully.");
            navigate(-1);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-full bg-[#F8F8F8]">
            <form
                className="mx-auto flex max-w-[440px] flex-col px-[32px] pb-[100px] pt-[24px]"
                onSubmit={(e) => { e.preventDefault(); handleChangePassword(); }}
            >
                <div className="mb-[28px] flex flex-row items-center">
                    <img src={logo} alt="" className="mr-[10px] h-[42px] w-[42px] object-contain" />
                    <p className="font-lexend-bold text-[28px] text-[#2B84E9]">WTTIN</p>
                </div>

                <h1 className="font-lexend-semibold mb-[24px] text-[20px]">Change Password</h1>

                <label className="font-lexend-medium mb-[6px] text-[14px] opacity-60">New Password</label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="font-lexend-regular mb-[16px] rounded-[8px] border border-gray-300 bg-white px-[14px] py-[12px] text-[16px] outline-none"
                />

                <label className="font-lexend-medium mb-[6px] text-[14px] opacity-60">Confirm Password</label>
                <input
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Confirm new password"
                    className="font-lexend-regular mb-[28px] rounded-[8px] border border-gray-300 bg-white px-[14px] py-[12px] text-[16px] outline-none"
                />

                <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center justify-center rounded-[25px] bg-[#F5C542] py-[14px] transition-transform duration-150 active:scale-95"
                >
                    <span className="font-lexend-semibold text-[16px] text-[#1a1a1a]">Change Password</span>
                </button>

                <button type="button" onClick={() => navigate(-1)} className="mt-[16px] text-center">
                    <span className="font-lexend-medium text-[14px] text-[#2B84E9]">Back</span>
                </button>
            </form>
        </div>
    );
}
