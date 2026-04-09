import { useAuth } from '@/providers/auth';
import { SplashScreen } from 'expo-router';
import { NativeTabs, Icon, Label, Badge } from 'expo-router/unstable-native-tabs';
import { useEffect } from 'react';

export function Layout() {

    const { user, loaded } = useAuth();

    useEffect(() => {
        if (loaded) {
            setTimeout(() => SplashScreen.hideAsync(), 1000);
        }
    }, [loaded]);
    
    const isAdmin = user?.role === "admin";
    
    if (!loaded) {
        return null;
    }
    return (
        <NativeTabs minimizeBehavior='automatic' backgroundColor={"#ffffff"} blurEffect="none" disableTransparentOnScrollEdge>
            <NativeTabs.Trigger name="(home)">
                <Icon sf={{ default: 'house', selected: 'house.fill' }} />
                <Label>Home</Label>
            </NativeTabs.Trigger>
            <NativeTabs.Trigger name="(map)">
                <Icon sf={{ default: 'map', selected: 'map.fill' }} />
                <Label>{'Map'}</Label>
            </NativeTabs.Trigger> 
            <NativeTabs.Trigger name="(chat)">
                <Icon sf={{ default: 'ellipses.bubble', selected: 'ellipses.bubble.fill' }} />
                <Label>{'Announcements'}</Label>
            </NativeTabs.Trigger>
            <NativeTabs.Trigger name="(more)">
                <Icon sf={{ default: 'ellipsis', selected: 'ellipsis' }} />
                <Label>{'More'}</Label>
            </NativeTabs.Trigger>
        </NativeTabs>
    );

}
