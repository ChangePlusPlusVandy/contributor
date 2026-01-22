export const clamp = (value: number, min: number, max: number): number => {
    return Math.min(Math.max(value, min), max);
}

export const hoursToString = (hours: Record<Weekday, [String, String] | null>) => {
    let str = "";
    for (const key of Object.keys(hours)) {
        if (!hours[key as Weekday]) {
            str += `${key.slice(0, 3)}:Closed `
        }
        else {
            str += `${key.slice(0, 3)}:${hours[key as Weekday]?.[0]}-${hours[key as Weekday]?.[1]} `
        }
    }
    return str;
}

export const isOpen = (hours: Record<Weekday, [String, String] | null>, day: Weekday, time: string) => {
    const todayHours = hours[day];
    if (!todayHours) return false;
    const openAt = Number(todayHours[0].slice(0, 2));
    const closeAt = Number(todayHours[1].slice(0, 2));
    const currentTime = Number(time.slice(0, 2));
    if (currentTime >= openAt && currentTime < closeAt) {
        return true;
    }
    return false;
}


// https://stackoverflow.com/questions/27928/calculate-distance-between-two-latitude-longitude-points-haversine-formula
function deg2rad(deg: number) {
    return deg * (Math.PI / 180)
}

export function getDistanceFromLatLon(lat1?: number | null, lon1?: number | null, lat2?: number | null, lon2?: number | null) {
    if (!lat1 || !lon1 || !lat2 || !lon2) {
        return 0;
    }
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2 - lat1);
    var dLon = deg2rad(lon2 - lon1);
    var a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
        ;
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c / 1.609; // Distance in mi
    return Number(d.toFixed(2));
}

const today = new Date();
const days: Weekday[] = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const day: Weekday = days[today.getDay()];
export const time = today.toISOString().slice(11, 16);