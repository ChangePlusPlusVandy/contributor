import { View, Text } from "react-native"
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from "expo-image"

export default function PageLayout({ title, children }: PageLayoutProps ) {
    return (
        <>
            <View className='absolute inset-0 bg-slate-100' />
            <View style={{ position: 'absolute', top: -80, left: -60, width: 260, height: 260, borderRadius: 130, backgroundColor: 'rgba(99,102,241,0.08)' }} />
            <View style={{ position: 'absolute', top: -30, right: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(6,182,212,0.06)' }} />
            <SafeAreaView className='px-6 -mb-5'>
                <View className='flex flex-row items-center justify-between'>
                    <Text className='text-[40px] font-bold'>{title}</Text>
                    <View>
                        <Image source={require("../assets/images/logo.webp")} style={{ width: 150, height: 50, transform: [{ translateY: 3 }] }} contentFit="contain" className='mt-3' />
                    </View>
                </View>
            </SafeAreaView>
            <View className='bg-white z-10 flex-1 rounded-t-[18px] shadow-xl'>
                {children}
            </View>
        </>
    );
}