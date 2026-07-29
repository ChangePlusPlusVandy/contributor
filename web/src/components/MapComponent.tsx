import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from "react-leaflet";
import L from "leaflet";
import { useEffect, useState } from "react";
import ResourceModal from "./ResourceModal";
import type { Coords } from "@/lib/location";
import markerIconUrl from "leaflet/dist/images/marker-icon.png";
import markerIcon2xUrl from "leaflet/dist/images/marker-icon-2x.png";
import markerShadowUrl from "leaflet/dist/images/marker-shadow.png";

export function resourceCoords(r: Resource): { latitude: number; longitude: number } | null {
    if (r.coordinates?.latitude != null && r.coordinates?.longitude != null) {
        return { latitude: r.coordinates.latitude, longitude: r.coordinates.longitude };
    }
    const legacy = r as Resource & { latitude?: number; longitude?: number };
    if (legacy.latitude != null && legacy.longitude != null) {
        return { latitude: legacy.latitude, longitude: legacy.longitude };
    }
    return null;
}

// Vite bundles Leaflet's marker images to hashed URLs, so the default
// CSS-relative icon paths break — build the icon from explicit imports.
export const resourceIcon = new L.Icon({
    iconUrl: markerIconUrl,
    iconRetinaUrl: markerIcon2xUrl,
    shadowUrl: markerShadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

const vendorIcon = L.divIcon({
    className: "",
    html: `<svg width="30" height="42" viewBox="0 0 30 42" xmlns="http://www.w3.org/2000/svg"><path d="M15 0C6.716 0 0 6.716 0 15c0 11.25 15 27 15 27s15-15.75 15-27C30 6.716 23.284 0 15 0z" fill="#2B84E9"/><circle cx="15" cy="15" r="6" fill="#ffffff"/></svg>`,
    iconSize: [30, 42],
    iconAnchor: [15, 42],
    popupAnchor: [0, -40],
});

function FlyTo({ target }: { target: Coords | null }) {
    const map = useMap();
    useEffect(() => {
        if (target) {
            map.flyTo([target.latitude - 0.005, target.longitude], 13, { duration: 1 });
        }
    }, [target]);
    return null;
}

function CenterOnLocation({ location }: { location: Coords | null }) {
    const map = useMap();
    const [hasCentered, setHasCentered] = useState<boolean>(false);
    useEffect(() => {
        if (location && !hasCentered) {
            map.flyTo([location.latitude - 0.005, location.longitude], 12, { duration: 1 });
            setHasCentered(true);
        }
    }, [location]);
    return null;
}

export default function MapComponent({ mapData, activeVendors, location, animateTo }: { mapData: Resource[], activeVendors: ActiveVendor[], location: Coords | null, animateTo: Coords | null }) {

    const [modalResource, setModalResource] = useState<Resource | null>(null);

    return (
        <div className="relative h-full w-full">
            <MapContainer
                center={[36.145, -86.78316]}
                zoom={11}
                className="h-full w-full"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <CenterOnLocation location={location} />
                <FlyTo target={animateTo} />
                {location && (
                    <CircleMarker
                        center={[location.latitude, location.longitude]}
                        radius={8}
                        pathOptions={{ color: "#ffffff", weight: 2, fillColor: "#2B84E9", fillOpacity: 1 }}
                    />
                )}
                {
                    mapData.map((resource: Resource, key: number) => {
                        const c = resourceCoords(resource);
                        const latitude = c?.latitude ?? 36.125;
                        const longitude = c?.longitude ?? -86.78316;

                        return <Marker
                            key={key}
                            position={[latitude, longitude]}
                            icon={resourceIcon}
                            eventHandlers={{ click: () => setModalResource(resource) }}
                        />

                    })
                }
                {activeVendors.map((vendor) => (
                    <Marker
                        key={vendor.vendor_id}
                        position={[vendor.location.latitude, vendor.location.longitude]}
                        icon={vendorIcon}
                    >
                        <Popup>
                            <div style={{ padding: 6, minWidth: 100 }}>
                                <p style={{ fontWeight: 600, fontSize: 13 }}>{vendor.name}</p>
                                <p style={{ fontSize: 11, color: "#16a34a" }}>Clocked In - Get your Newspaper Here!</p>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
            {
                modalResource && <ResourceModal modalResource={modalResource} closeModalResource={() => setModalResource(null)} location={location} />
            }
        </div>
    );

}
