import { X, Bookmark } from "lucide-react";
import { getDistanceFromLatLon, hoursToString } from "@/lib/utils";
import { useBookmarks } from "@/providers/bookmarks";
import type { Coords } from "@/lib/location";
import logo from "@/assets/images/logo-svg.svg";

function formatResourceHours(hours: unknown): string {
    if (hours == null) return "";
    if (typeof hours === "string") return hours;
    if (typeof hours === "object") {
        return hoursToString(hours as Record<Weekday, [string, string] | null>);
    }
    return String(hours);
}

function normalizeWebsiteUrl(raw: string | null | undefined): string | null {
    if (raw == null || String(raw).trim() === "") return null;
    const t = String(raw).trim();
    if (/^https?:\/\//i.test(t)) return t;
    return `https://${t}`;
}

function hasValue(value: string | null | undefined): boolean {
    return value != null && value.trim() !== "";
}

function Field({ label, value }: { label: string, value: string | null | undefined }) {
    if (!hasValue(value)) return null;
    return (
        <p className="font-lexend-bold mt-1 text-[10px] first:mt-0">{label}: <span className="font-lexend-medium">{value}</span></p>
    );
}

export default function ResourceModal({ modalResource, closeModalResource, location, absolute = true }: { modalResource: Resource, closeModalResource: () => void, location: Coords | null, absolute?: boolean }) {

    const { isBookmarked, toggleBookmark } = useBookmarks();
    const bookmarked = isBookmarked(modalResource.org_name);
    const websiteUrl = normalizeWebsiteUrl(modalResource.website);

    const coordinates = modalResource.coordinates;
    const directionsUrl = coordinates != null
        ? `https://www.google.com/maps/dir/?api=1&destination=${coordinates.latitude},${coordinates.longitude}`
        : null;

    return (
        <div
            className={`${absolute ? "absolute bottom-[var(--tab-bar-clearance)] left-[10px] right-[10px] z-[1000] md:bottom-[20px]" : "w-full"} animate-fade-in rounded-[20px] bg-white px-3 py-2 text-left shadow-[2px_2px_4px_rgba(0,0,0,0.1)]`}
        >
            <div className="flex flex-row items-center">
                <img src={logo} alt="" className="h-[24px] w-[24px] object-contain" />
                <p className="font-lexend-bold ml-[5px] flex-1 truncate text-[14px]">{modalResource.org_name}</p>
                <button type="button" onClick={() => toggleBookmark(modalResource)} className="mr-[4px] p-[4px]" aria-label="Bookmark resource">
                    <Bookmark size={18} color="#2B84E9" fill={bookmarked ? "#2B84E9" : "none"} />
                </button>
                <span className="font-lexend-medium mr-[5px] text-[12px] text-[#2B84E9]">{getDistanceFromLatLon(modalResource.coordinates?.latitude, modalResource.coordinates?.longitude, location?.latitude, location?.longitude)} mi</span>
                {
                    absolute && <button type="button" onClick={closeModalResource} aria-label="Close">
                        <X size={25} />
                    </button>
                }
            </div>
            {hasValue(modalResource.group) && (
                <p className="font-lexend-medium mt-1 text-[12px]">{modalResource.group}</p>
            )}
            <div className="mt-2">
                <Field label="Services" value={modalResource.services} />
                <Field label="Requirements" value={modalResource.requirements} />
                <Field label="Application Process" value={modalResource.app_process} />
                <Field label="Hours" value={formatResourceHours(modalResource.hours)} />
                <Field label="Address" value={modalResource.address} />
                <Field label="Bus Line" value={modalResource.bus_line} />
            </div>
            <div className="mt-2">
                {directionsUrl != null && (
                    <a href={directionsUrl} target="_blank" rel="noreferrer" className="font-lexend-medium block text-[11px] text-[#2B84E9]">
                        Directions
                    </a>
                )}
                {websiteUrl != null && (
                    <a href={websiteUrl} target="_blank" rel="noreferrer" className="font-lexend-medium mt-1 block truncate text-[11px] text-[#2B84E9]">
                        Visit Website
                    </a>
                )}
                {hasValue(modalResource.org_phones) && (
                    <a href={`tel:${modalResource.org_phones}`} className="font-lexend-medium mt-1 block text-[11px] text-[#2B84E9] active:text-[#76b6ffee]">
                        Call: {modalResource.org_phones}
                    </a>
                )}
            </div>
        </div>
    );
}
