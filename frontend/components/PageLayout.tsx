import { View, Text } from "react-native"
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from "expo-image"

export default function PageLayout({ title, children }: PageLayoutProps ) {
    return (
        <>
            <View className='absolute inset-0 bg-blue-200' />
            <SafeAreaView className='px-6 -mb-5'>
                <View className='flex flex-row items-center justify-between'>
                    <Text className='text-[40px] font-bold'>{title}</Text>
                    <View>
                        <Image source={require("../assets/images/logo.webp")} style={{ width: 150, height: 50, transform: [{ translateY: 3 }] }} contentFit="contain" className='mt-3' />
                    </View>
                </View>
            </SafeAreaView>
            <View className='bg-white z-10 h-full rounded-t-[18px] transform shadow-xl shadow-blue-500/80'>
                {children}
            </View>
        </>
    );
}