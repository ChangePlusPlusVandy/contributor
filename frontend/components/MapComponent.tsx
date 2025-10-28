import MapView, { Marker, Callout } from 'react-native-maps';
import { ActivityIndicator, View, StyleSheet, Text } from "react-native";

export default function MapComponent({ mapData }: { mapData: MapResource[] }) {

    return (
        <MapView
            initialRegion={{
                latitude: 36.145,
                longitude: -86.78316,
                latitudeDelta: 0.2,
                longitudeDelta: 0.2,
            }}
            style={styles.map}
        >
            {
                mapData.map((resource: MapResource, key: number) => {

                    const phone: string = resource.phone.toString();

                    return <Marker
                        key={key}
                        coordinate={{ latitude: resource.latitude || 36.125, longitude: resource.longitude || -86.78316 }}
                        calloutOffset={{ x: 0.0, y: -50.0 }}
                    >
                        <Callout>
                            <Text className='text-xl mb-1'>{resource.org_name}</Text>
                            <Text className='text-black/60 mb-1'>Email: {resource.email}</Text>
                            <Text className='text-black/60'>Phone: {`${phone.slice(0, 3)}-${phone.slice(3, 6)}-${phone.slice(6)}`}</Text>
                        </Callout>
                    </Marker>
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