import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from "react-leaflet";
import L from "leaflet";
import { useEffect, useRef, useState, type ReactNode } from "react";
import ResourceModal from "./ResourceModal";
import type { Coords } from "@/lib/location";

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

function pinIcon(color: string, highlight: string) {
    const gradientId = `pin-${color.slice(1)}`;
    return L.divIcon({
        className: "",
        html: `<span class="map-pin"><svg width="34" height="46" viewBox="-2 -2 34 46" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="${gradientId}" x1="100%" y1="0%" x2="10%" y2="100%"><stop offset="0" stop-color="${highlight}"/><stop offset="1" stop-color="${color}"/></linearGradient></defs><path d="M15 0C6.716 0 0 6.716 0 15c0 11.25 15 27 15 27s15-15.75 15-27C30 6.716 23.284 0 15 0z" fill="url(#${gradientId})" stroke="#ffffff" stroke-width="2.5"/><circle cx="15" cy="15" r="6" fill="#ffffff"/></svg></span>`,
        iconSize: [34, 46],
        iconAnchor: [17, 44],
        popupAnchor: [0, -58],
    });
}

export const resourceIcon = pinIcon("#DF453A", "#E96054");
const vendorIcon = pinIcon("#2B84E9", "#4F9BF0");

// Toggle a class rather than swap the icon: swapping replaces the marker's DOM,
// which restarts the element and skips the scale transition.
function ResourceMarker({ position, selected, onSelect }: { position: [number, number], selected: boolean, onSelect: () => void }) {
    const markerRef = useRef<L.Marker | null>(null);
    useEffect(() => {
        markerRef.current?.getElement()?.classList.toggle("map-pin-selected", selected);
    }, [selected]);
    return (
        <Marker
            ref={markerRef}
            position={position}
            icon={resourceIcon}
            zIndexOffset={selected ? 1000 : 0}
            eventHandlers={{ click: onSelect }}
        />
    );
}

// The Leaflet popup already tracks open/closed, so the scale can follow it
// directly instead of duplicating the state in React.
function VendorMarker({ position, children }: { position: [number, number], children: ReactNode }) {
    const markerRef = useRef<L.Marker | null>(null);
    const setSelected = (selected: boolean) => {
        markerRef.current?.getElement()?.classList.toggle("map-pin-selected", selected);
        markerRef.current?.setZIndexOffset(selected ? 1000 : 0);
    };
    return (
        <Marker
            ref={markerRef}
            position={position}
            icon={vendorIcon}
            eventHandlers={{ popupopen: () => setSelected(true), popupclose: () => setSelected(false) }}
        >
            {children}
        </Marker>
    );
}

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

    // isolate keeps Leaflet's own z-indexes (panes/controls go up to 1000) from painting over the nav bar.
    return (
        <div className="relative isolate h-full w-full">
            <MapContainer
                center={[36.145, -86.78316]}
                zoom={11}
                className="h-full w-full"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
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

                        return <ResourceMarker
                            key={key}
                            position={[latitude, longitude]}
                            selected={modalResource === resource}
                            onSelect={() => setModalResource(prev => prev === resource ? null : resource)}
                        />

                    })
                }
                {activeVendors.map((vendor) => (
                    <VendorMarker
                        key={vendor.vendor_id}
                        position={[vendor.location.latitude, vendor.location.longitude]}
                    >
                        <Popup>
                            <div style={{ padding: 6, minWidth: 100 }}>
                                <p style={{ fontWeight: 600, fontSize: 13 }}>{vendor.name}</p>
                                <p style={{ fontSize: 11, color: "#16a34a" }}>Clocked In - Get your Newspaper Here!</p>
                            </div>
                        </Popup>
                    </VendorMarker>
                ))}
            </MapContainer>
            {
                modalResource && <ResourceModal modalResource={modalResource} closeModalResource={() => setModalResource(null)} location={location} />
            }
        </div>
    );

}
