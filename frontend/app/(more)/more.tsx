import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';

export default function More() {
    return (
        <>
            <SafeAreaView className='px-6'>
                <View className='flex flex-row items-center justify-between'>
                    <Text className='text-[40px] font-bold'>More</Text>
                    <View>
                        <Image source={require("../../assets/images/logo.webp")} style={{ width: 150, height: 60 }} contentFit="contain" className='mt-3'/>
                    </View>
                </View>
            </SafeAreaView>
        </>
    );
}