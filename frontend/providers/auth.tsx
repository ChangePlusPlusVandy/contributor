import { useApi } from "@/lib/api";
import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import * as SecureStore from 'expo-secure-store';
import axios from "axios";
import { config } from "@/lib/env";

type AuthContextType = {
    user: User | null;
    setUser: (user: User | null) => void;
    loaded: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {

    const [user, setUser] = useState<User | null>(null);
    const [loaded, setLoaded] = useState<boolean>(false);

    useEffect(() => {

        const init = async () => {
            const store = await SecureStore.getItemAsync("auth");
            if (!store) {
                setLoaded(true);
                return;
            }
            const auth: AuthStore = JSON.parse(store);
            try {
                const res = await axios.get(`${config.API_URL}${auth.role == "admin" ? "admin" : "auth"}/me`, {
                    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${auth.accessToken}` },
                });
                const { supabase_id, ...userData } = res.data.admin;
                setUser(userData);
            } 
            finally {
                setLoaded(true);
            }
        }
        init();

    }, [])

    return (
        <AuthContext.Provider value={{ user, setUser, loaded }}>
            {children}
        </AuthContext.Provider>
    );

};


export const useAuth = () => {
    const auth = useContext(AuthContext);
    if (!auth) throw Error("Auth context undefined.");
    return auth;
};
