import { ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import type { LatLng, Marker as LeafletMarker } from "leaflet";
import { X, Loader2 } from "lucide-react";
import { Header } from "@/components/Header";
import { resourceIcon } from "@/components/MapComponent";
import { useAuthApi } from "@/lib/api";
import { useAuth } from "@/providers/auth";
import { getCurrentPosition, type Coords } from "@/lib/location";
import standImg from "@/assets/images/more-page/stand.png";
import computerImg from "@/assets/images/more-page/computer.png";
import bookImg from "@/assets/images/more-page/book.png";
import foodImg from "@/assets/images/more-page/food.png";

const cardShadow = "shadow-[2px_2px_4px_rgba(0,0,0,0.2)]";

const Button = ({ children, onClick }: { children: ReactNode, onClick?: () => void }) => {
    return (
        <button type="button" onClick={onClick} className="block w-full text-left transition-transform duration-150 active:scale-95">
            {children}
        </button>
    );
}

const DefaultMorePage = () => {

    const navigate = useNavigate();

    return (
        <div className="bg-[#F8F8F8]">
            <Header />
            <div className="px-[24px] pb-[40px] pt-[16px]">
                <h2 className="font-lexend-semibold mb-[10px] text-[18px]">Login</h2>
                <div className="flex flex-row items-center">
                    <div className="mr-2 flex-1">
                        <Button onClick={() => navigate("/more/login?role=vendor")}>
                            <div className={`flex h-[164px] flex-col items-center justify-center rounded-[5px] bg-white ${cardShadow}`}>
                                <img src={standImg} alt="" className="mb-[18px] h-[75px] w-[75px] object-contain" />
                                <p className="font-lexend-bold text-[18px]">Vendor Login</p>
                            </div>
                        </Button>
                    </div>
                    <div className="ml-2 flex-1">
                        <Button onClick={() => navigate("/more/login?role=admin")}>
                            <div className={`flex h-[164px] flex-col items-center justify-center rounded-[5px] bg-white ${cardShadow}`}>
                                <img src={computerImg} alt="" className="mb-[18px] h-[75px] w-[75px] object-contain" />
                                <p className="font-lexend-bold text-[18px]">Admin Login</p>
                            </div>
                        </Button>
                    </div>
                </div>
                <h2 className="font-lexend-semibold mb-[10px] mt-[18px] text-[18px]">Request Printed Guide</h2>
                <div className="flex flex-row items-center">
                    <div className="flex-1">
                        <Button onClick={() => window.open("https://docs.google.com/forms/d/e/1FAIpQLScVdITiNsBMmL-Fc8TtAnDFRMP6Rf7gKkqEifPAZ7nxMvTVLQ/viewform", "_blank", "noopener")}>
                            <div className={`flex h-[135px] flex-row items-center justify-center gap-[27px] rounded-[5px] bg-white ${cardShadow}`}>
                                <img src={bookImg} alt="" className="mb-[18px] h-[75px] w-[75px] translate-y-[8px] object-contain" />
                                <p className="font-lexend-medium w-full max-w-[196px] text-[13px] opacity-60">Request to pick up a 2026 WTTIN resource guide.</p>
                            </div>
                        </Button>
                    </div>
                </div>
                <h2 className="font-lexend-semibold mb-[10px] mt-[18px] text-[18px]">Register a Resource</h2>
                <div className="flex flex-row items-center">
                    <div className="flex-1">
                        <Button onClick={() => window.open("https://form.jotform.com/jessehaovanderbilt/register-a-resource", "_blank", "noopener")}>
                            <div className={`flex h-[135px] flex-row items-center justify-center gap-[27px] rounded-[5px] bg-white ${cardShadow}`}>
                                <img src={foodImg} alt="" className="mb-[18px] h-[75px] w-[75px] object-contain" />
                                <p className="font-lexend-medium w-full max-w-[196px] text-[13px] opacity-60">Apply to register a resource or to update an existing entry.</p>
                            </div>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

const NASHVILLE_FALLBACK: [number, number] = [36.1627, -86.7816];

const CLOCK_IN_LOCATION_KEY = "clock_in_location";

function MapClickHandler({ enabled, onPick }: { enabled: boolean, onPick: (latlng: LatLng) => void }) {
    useMapEvents({
        click: (e) => {
            if (enabled) onPick(e.latlng);
        },
    });
    return null;
}

function CenterOnLocation({ location }: { location: Coords | null }) {
    const map = useMap();
    useEffect(() => {
        if (location) {
            map.flyTo([location.latitude, location.longitude], 13, { duration: 1 });
        }
    }, [location]);
    return null;
}

/** Leaflet doesn't track CSS height transitions — recalc after the expand/collapse animation. */
function ResizeOnChange({ trigger }: { trigger: boolean }) {
    const map = useMap();
    useEffect(() => {
        const t = setTimeout(() => map.invalidateSize(), 450);
        return () => clearTimeout(t);
    }, [trigger]);
    return null;
}

const VendorMorePage = () => {

    const { logout } = useAuth();
    const navigate = useNavigate();
    const { makeRequest } = useAuthApi();
    const [location, setLocation] = useState<Coords | null>(null);
    const [editingLocation, setEditingLocation] = useState<boolean>(false);
    const [pickedLocation, setPickedLocation] = useState<Coords | null>(null);
    const [isClockedIn, setIsClockedIn] = useState(false);

    const saveLocationToStorage = (loc: Coords) => {
        try {
            localStorage.setItem(CLOCK_IN_LOCATION_KEY, JSON.stringify(loc));
        } catch (error) {
            console.error("Failed to save location:", error);
        }
    }

    const loadLocationFromStorage = () => {
        try {
            const saved = localStorage.getItem(CLOCK_IN_LOCATION_KEY);
            if (saved) {
                const loc = JSON.parse(saved);
                setPickedLocation(loc);
            }
        } catch (error) {
            console.error("Failed to load location:", error);
        }
    }

    const toggleEditLocation = () => {
        setEditingLocation(prev => !prev);
    };

    const updatePickedLocation = (loc: Coords) => {
        setPickedLocation(loc);
        saveLocationToStorage(loc);
        makeRequest("auth/location", {
            method: "PATCH",
            body: JSON.stringify({ latitude: loc.latitude, longitude: loc.longitude }),
        });
    };

    const handleClockIn = async () => {
        const data = await makeRequest("auth/clock-in", { method: "POST" });
        if (!data.error) setIsClockedIn(true);
    };

    const handleClockOut = async () => {
        const data = await makeRequest("auth/clock-out", { method: "POST" });
        if (!data.error) setIsClockedIn(false);
    };

    useEffect(() => {
        getCurrentPosition().then(setLocation);
        loadLocationFromStorage();
        makeRequest("auth/me").then(data => {
            if (data.user) setIsClockedIn(data.user.is_clocked_in ?? false);
        });
    }, []);

    const contentFade = `transition-opacity duration-[400ms] ${editingLocation ? "pointer-events-none opacity-0" : "opacity-100"}`;

    return (
        <div className="bg-[#F8F8F8]">
            <Header />
            <div className="px-[24px] pb-[40px] pt-[16px]">
                <h2 className="font-lexend-semibold mb-[10px] text-[18px]">Location</h2>
                <div
                    className="overflow-hidden rounded-[5px] transition-[height] duration-[400ms] ease-in-out"
                    style={{ height: editingLocation ? "65vh" : 180 }}
                >
                    <div className={`relative h-full bg-white ${cardShadow}`}>
                        {
                            editingLocation &&
                            <>
                                <button type="button" className="absolute right-[1px] top-[1px] z-[1000]" onClick={toggleEditLocation} aria-label="Close map editor">
                                    <X color="black" />
                                </button>
                                <p className="absolute left-[4px] top-[4px] z-[1000] rounded bg-white/80 px-1">
                                    Pick a place to clock in.
                                </p>
                            </>
                        }
                        <MapContainer center={NASHVILLE_FALLBACK} zoom={13} className="h-full w-full">
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                            />
                            <MapClickHandler enabled={editingLocation} onPick={(latlng) => updatePickedLocation({ latitude: latlng.lat, longitude: latlng.lng })} />
                            <CenterOnLocation location={location} />
                            <ResizeOnChange trigger={editingLocation} />
                            {pickedLocation && (
                                <Marker
                                    position={[pickedLocation.latitude, pickedLocation.longitude]}
                                    icon={resourceIcon}
                                    draggable
                                    eventHandlers={{
                                        dragend: (e) => {
                                            const newLoc = (e.target as LeafletMarker).getLatLng();
                                            updatePickedLocation({ latitude: newLoc.lat, longitude: newLoc.lng });
                                        },
                                    }}
                                />
                            )}
                        </MapContainer>
                    </div>
                </div>
                <div>
                    <div className={contentFade}>
                        <Button onClick={!editingLocation ? toggleEditLocation : undefined}>
                            <div className={`mt-[12px] flex h-[33px] flex-row items-center justify-center rounded-[10px] bg-white ${cardShadow}`}>
                                <p className="font-lexend-medium w-full text-center text-[13px] text-[#2B84E9] opacity-60">Edit Clock-In Location</p>
                            </div>
                        </Button>
                        {isClockedIn ? (
                            <div className={`mt-[12px] flex h-[33px] flex-row items-center justify-center rounded-[10px] bg-[#16a34a] ${cardShadow}`}>
                                <p className="font-lexend-medium text-[13px] text-white">Clocked In ✓</p>
                            </div>
                        ) : (
                            <Button onClick={handleClockIn}>
                                <div className={`mt-[12px] flex h-[33px] flex-row items-center justify-center rounded-[10px] bg-white ${cardShadow}`}>
                                    <p className="font-lexend-medium w-full text-center text-[13px] text-[#2B84E9] opacity-60">Clock In</p>
                                </div>
                            </Button>
                        )}
                        {isClockedIn && (
                            <Button onClick={handleClockOut}>
                                <div className={`mt-[12px] flex h-[33px] flex-row items-center justify-center rounded-[10px] bg-white ${cardShadow}`}>
                                    <p className="font-lexend-medium w-full text-center text-[13px] text-[#E53935] opacity-60">Clock Out</p>
                                </div>
                            </Button>
                        )}
                    </div>
                    <div className={contentFade}>
                        <h2 className="font-lexend-semibold mb-[10px] mt-[12px] text-[18px]">Request Printed Guide</h2>
                        <div className="flex flex-row items-center">
                            <div className="flex-1">
                                <Button>
                                    <div className={`flex h-[135px] flex-row items-center justify-center gap-[27px] rounded-[5px] bg-white ${cardShadow}`}>
                                        <img src={bookImg} alt="" className="mb-[18px] h-[75px] w-[75px] translate-y-[8px] object-contain" />
                                        <p className="font-lexend-medium w-full max-w-[196px] text-[14px] opacity-60">We are working on a version for 2026. Request to be notified when those are ready to pick up.</p>
                                    </div>
                                </Button>
                            </div>
                        </div>
                        <Button onClick={() => navigate("/more/change-password")}>
                            <div className={`mt-[18px] flex h-[33px] flex-row items-center justify-center rounded-[10px] bg-white ${cardShadow}`}>
                                <p className="font-lexend-medium w-full text-center text-[13px] text-[#2B84E9] opacity-60">Change Password</p>
                            </div>
                        </Button>
                        <Button onClick={logout}>
                            <div className={`mt-[12px] flex h-[33px] flex-row items-center justify-center rounded-[10px] bg-white ${cardShadow}`}>
                                <p className="font-lexend-medium w-full text-center text-[13px] text-[#2B84E9] opacity-60">Logout</p>
                            </div>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

const AdminMorePage = () => {

    const { logout } = useAuth();
    const navigate = useNavigate();
    const { makeRequest } = useAuthApi();
    const [pendingResources, setPendingResources] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchPending = async () => {
        setLoading(true);
        const result = await makeRequest("resources/pending/");
        if (result.resources) setPendingResources(result.resources);
        setLoading(false);
    };

    useEffect(() => { fetchPending(); }, []);

    const handleApprove = async (id: string) => {
        const result = await makeRequest(`resources/pending/${id}/approve`, { method: "POST" });
        if (!result.error) setPendingResources(prev => prev.filter(r => r._id !== id));
    };

    const handleDeny = async (id: string) => {
        const result = await makeRequest(`resources/pending/${id}/deny`, { method: "POST" });
        if (!result.error) setPendingResources(prev => prev.filter(r => r._id !== id));
    };

    const formatValue = (key: string, value: unknown): string => {
        if (key === 'submitted_at' && typeof value === 'string')
            return new Date(value).toLocaleString("en-US", { timeZone: "America/Chicago", dateStyle: "medium", timeStyle: "short" });
        if (typeof value === 'object')
            return JSON.stringify(value);
        return String(value);
    };

    const getResourceFields = (resource: any): [string, unknown][] => [
        ['Action', resource.add ? 'Add New Resource' : 'Edit Existing Resource'],
        ...Object.entries(resource).filter(([key, value]) => key !== 'add' && key !== '_id' && value !== null && value !== 'null'),
    ];

    return (
        <div className="flex min-h-full flex-col bg-[#F8F8F8]">
            <Header />
            <div className="flex flex-1 flex-col justify-between px-[24px] pb-[40px] pt-[16px]">
                <div className="flex flex-col justify-around">
                    <Button onClick={() => navigate("/more/vendor-list")}>
                        <div className={`mb-[15px] flex h-[33px] flex-row items-center justify-center rounded-[10px] bg-white ${cardShadow}`}>
                            <p className="font-lexend-medium w-full text-center text-[13px] text-[#2B84E9] opacity-60">View Vendors</p>
                        </div>
                    </Button>
                    <Button onClick={() => navigate("/more/change-password?role=admin")}>
                        <div className={`mb-[15px] flex h-[33px] flex-row items-center justify-center rounded-[10px] bg-white ${cardShadow}`}>
                            <p className="font-lexend-medium w-full text-center text-[13px] text-[#2B84E9] opacity-60">Change Password</p>
                        </div>
                    </Button>
                    <Button onClick={logout}>
                        <div className={`mb-[15px] flex h-[33px] flex-row items-center justify-center rounded-[10px] bg-white ${cardShadow}`}>
                            <p className="font-lexend-medium w-full text-center text-[13px] text-[#2B84E9] opacity-60">Logout</p>
                        </div>
                    </Button>
                </div>
                <div>
                    <h2 className="font-lexend-semibold mb-[10px] text-[18px]">Pending Resources</h2>
                    {loading && <Loader2 className="animate-spin" />}
                    {!loading && pendingResources.length === 0 && (
                        <p className="font-lexend-medium text-[13px] opacity-60">No pending resources.</p>
                    )}
                    {
                        !loading &&
                        <>
                            {pendingResources.map(resource => (
                                <div key={resource._id} className={`mb-[10px] rounded-[5px] bg-white p-[14px] ${cardShadow}`}>
                                    <p className="font-lexend-semibold mb-[10px] text-[15px]">{resource.org_name}</p>
                                    <div className="mb-[10px]">
                                        {getResourceFields(resource).map(([key, value]) => (
                                            <div key={key} className="mb-[6px]">
                                                <p className="font-lexend-medium text-[12px] text-[#666]">{key}:</p>
                                                <p className="font-lexend break-words" style={{ fontSize: key === 'Action' ? 14 : 12 }}>{formatValue(key, value)}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex flex-row gap-[8px]">
                                        <button type="button" onClick={() => handleApprove(resource._id)} className="flex h-[33px] items-center justify-center rounded-[10px] bg-[#2B84E9] px-[16px] transition-transform duration-150 active:scale-95">
                                            <span className="font-lexend-medium text-[13px] text-white">Approve</span>
                                        </button>
                                        <button type="button" onClick={() => handleDeny(resource._id)} className="flex h-[33px] items-center justify-center rounded-[10px] border border-[#E0E0E0] bg-white px-[16px] transition-transform duration-150 active:scale-95">
                                            <span className="font-lexend-medium text-[13px] text-[#E53935]">Deny</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </>
                    }
                </div>
            </div>
        </div>
    );
}


export default function More() {

    const { user } = useAuth();
    const pages: Record<string, ReactNode> = {
        "vendor": <VendorMorePage />,
        "admin": <AdminMorePage />,
        "default": <DefaultMorePage />
    }

    if (user) {
        return pages[user.role];
    }
    return pages["default"];

}
