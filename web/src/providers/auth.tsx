import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "";

type AuthContextType = {
    user: User | null;
    setUser: (user: User | null) => void;
    logout: () => void;
    loaded: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {

    const [user, setUser] = useState<User | null>(null);
    const [loaded, setLoaded] = useState<boolean>(false);

    useEffect(() => {

        const init = async () => {
            const store = localStorage.getItem("auth");
            if (!store) {
                setLoaded(true);
                return;
            }
            const auth: AuthStore = JSON.parse(store);
            try {
                const res = await axios.get(`${API_URL}${auth.role === "admin" ? "admin" : "auth"}/me`, {
                    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${auth.accessToken}` },
                });
                const payload = auth.role === "admin" ? res.data.admin : res.data.user;
                const { supabase_id, password_set, vendor_id, ...rest } = payload;
                setUser(auth.role === "vendor" ? { ...rest, email: vendor_id } : rest);
            } catch {
                localStorage.removeItem("auth");
            } finally {
                setLoaded(true);
            }
        }
        init();

    }, [])

    const logout = () => {
        localStorage.removeItem("auth");
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, setUser, logout, loaded }}>
            {children}
        </AuthContext.Provider>
    );

};


export const useAuth = () => {
    const auth = useContext(AuthContext);
    if (!auth) throw Error("Auth context undefined.");
    return auth;
};
