export type Coords = { latitude: number; longitude: number };

/**
 * Browser replacement for expo-location's permission prompt +
 * getCurrentPositionAsync. Resolves null when the permission is denied,
 * geolocation is unavailable, or the position times out.
 */
export function getCurrentPosition(): Promise<Coords | null> {
	return new Promise((resolve) => {
		if (!("geolocation" in navigator)) {
			resolve(null);
			return;
		}
		navigator.geolocation.getCurrentPosition(
			(pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
			() => resolve(null),
			{ enableHighAccuracy: true, timeout: 10000 }
		);
	});
}
