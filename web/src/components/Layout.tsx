import { NavLink, Outlet, useLocation } from "react-router-dom";
import { House, Map, MessageCircleMore, Ellipsis } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";
import { useAuth } from "@/providers/auth";
import logo from "@/assets/images/logo-svg.svg";

const NAV_ITEMS = [
    { to: "/", label: "Home", icon: House },
    { to: "/map", label: "Map", icon: Map },
    { to: "/announcements", label: "Announcements", icon: MessageCircleMore },
    { to: "/more", label: "More", icon: Ellipsis },
];

export function Layout() {

    const { loaded } = useAuth();
    const { pathname } = useLocation();
    const navRef = useRef<HTMLElement>(null);
    const tabRefs = useRef<(HTMLAnchorElement | null)[]>([]);
    const [highlight, setHighlight] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

    // /bookmarks and /category are reached from Home, so they keep the Home tab selected.
    const activeIndex = NAV_ITEMS.findIndex(({ to }) =>
        to === "/" ? ["/", "/bookmarks", "/category"].includes(pathname) : pathname.startsWith(to)
    );

    // The tabs are content-sized, so the sliding highlight has to be measured off the active one.
    useLayoutEffect(() => {
        const nav = navRef.current;
        const tab = tabRefs.current[activeIndex];
        if (!nav || !tab) {
            setHighlight(null);
            return;
        }
        const measure = () => setHighlight({ x: tab.offsetLeft, y: tab.offsetTop, width: tab.offsetWidth, height: tab.offsetHeight });
        measure();
        // Re-measure on viewport/breakpoint changes and when the web font swaps in and relabels widths.
        const observer = new ResizeObserver(measure);
        observer.observe(nav);
        observer.observe(tab);
        return () => observer.disconnect();
    }, [activeIndex, loaded]);

    if (!loaded) {
        return null;
    }
    return (
        <div className="flex h-dvh flex-col bg-[#F8F8F8]">
            <main
                className="order-first flex-1 overflow-y-auto pb-[var(--tab-bar-clearance)] md:order-last md:pb-0"
                style={{ paddingTop: "env(safe-area-inset-top)" }}
            >
                <Outlet />
            </main>
            <nav
                ref={navRef}
                className="order-last fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)_+_12px)] z-40 flex justify-around rounded-[28px] border border-black/5 bg-white/80 p-[6px] backdrop-blur-xl md:relative md:inset-x-auto md:bottom-auto md:order-first md:justify-start md:gap-2 md:rounded-none md:border-x-0 md:border-t-0 md:border-black/10 md:bg-white md:px-6 md:py-0 md:backdrop-blur-none"
            >
                <span
                    aria-hidden
                    className={`pointer-events-none absolute left-0 top-0 rounded-[22px] bg-black/[0.07] transition-[transform,width,height] duration-300 ease-out motion-reduce:transition-none md:rounded-full ${
                        highlight ? "opacity-100" : "opacity-0"
                    }`}
                    style={
                        highlight
                            ? { width: highlight.width, height: highlight.height, transform: `translate(${highlight.x}px, ${highlight.y}px)` }
                            : undefined
                    }
                />
                <img src={logo} alt="" className="mr-2 hidden h-9 w-9 self-center object-contain md:block" />
                {NAV_ITEMS.map(({ to, label, icon: Icon }, index) => (
                    <NavLink
                        key={to}
                        to={to}
                        aria-current={index === activeIndex ? "page" : undefined}
                        ref={(node) => { tabRefs.current[index] = node; }}
                        className={`relative flex flex-auto flex-col items-center gap-[2px] rounded-[22px] px-1 py-2 text-[10px] font-lexend-medium md:flex-none md:flex-row md:gap-2 md:rounded-full md:px-3 md:py-3 md:text-[14px] ${
                            index === activeIndex ? "text-[#2B84E9]" : "text-black/60"
                        }`}
                    >
                        <Icon size={22} />
                        <span>{label}</span>
                    </NavLink>
                ))}
            </nav>
        </div>
    );

}
