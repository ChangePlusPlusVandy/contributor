import MapView, { Marker } from 'react-native-maps';
import { ActivityIndicator, View, StyleSheet } from "react-native";

export default function MapComponent({ mapData }: { mapData: MapResource[] }) {

    return (
        <MapView
            initialRegion={{
                latitude: 36.125,
                longitude: -86.78316,
                latitudeDelta: 0.2,
                longitudeDelta: 0.2,
            }}
            style={styles.map}
        >
            {
                mapData.map((resource, key) => {
                    return <Marker
                        key={key}
                        coordinate={{ latitude: resource.latitude || 36.125, longitude: resource.longitude || -86.78316 }}
                    />
                })
            }
        </MapView>
    );
    
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        width: '100%',
        height: '100%',
        borderTopLeftRadius: 18,
        borderTopRightRadius: 18,
        overflow: 'hidden',
    },
});