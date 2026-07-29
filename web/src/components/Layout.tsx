import { NavLink, Outlet } from "react-router-dom";
import { House, Map, MessageCircle, Ellipsis } from "lucide-react";
import { useAuth } from "@/providers/auth";
import logo from "@/assets/images/logo-svg.svg";

const NAV_ITEMS = [
    { to: "/", label: "Home", icon: House },
    { to: "/map", label: "Map", icon: Map },
    { to: "/announcements", label: "Announcements", icon: MessageCircle },
    { to: "/more", label: "More", icon: Ellipsis },
];

export function Layout() {

    const { loaded } = useAuth();

    if (!loaded) {
        return null;
    }
    return (
        <div className="flex h-dvh flex-col bg-[#F8F8F8]">
            <main
                className="order-first flex-1 overflow-y-auto md:order-last"
                style={{ paddingTop: "env(safe-area-inset-top)" }}
            >
                <Outlet />
            </main>
            <nav
                className="order-last z-40 flex justify-around border-t border-black/10 bg-white md:order-first md:justify-start md:gap-2 md:border-b md:border-t-0 md:px-6"
                style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
            >
                <img src={logo} alt="" className="mr-2 hidden h-9 w-9 self-center object-contain md:block" />
                {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
                    <NavLink
                        key={to}
                        to={to}
                        end={to === "/"}
                        className={({ isActive }) =>
                            `flex flex-col items-center gap-[2px] px-3 py-2 text-[10px] font-lexend-medium md:flex-row md:gap-2 md:py-4 md:text-[14px] ${
                                isActive ? "text-[#2B84E9]" : "text-black/60"
                            }`
                        }
                    >
                        <Icon size={22} />
                        <span>{label}</span>
                    </NavLink>
                ))}
            </nav>
        </div>
    );

}
