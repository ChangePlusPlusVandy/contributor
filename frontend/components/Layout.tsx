import { AuthProvider, useAuth } from '@/providers/auth';
import { SplashScreen } from 'expo-router';
import { NativeTabs, Icon, Label, Badge } from 'expo-router/unstable-native-tabs';
import { useEffect } from 'react';

const AdminTabs = () => {
    return (
        <>
            <NativeTabs.Trigger name="(map)">
                <Icon sf={{ default: 'message', selected: 'message.fill' }} />
                <Label>Messages</Label>
            </NativeTabs.Trigger>
            <NativeTabs.Trigger name="(chat)">
                <Icon sf={{ default: 'chart.bar', selected: 'chart.bar.fill' }} />
                <Label>Analytics</Label>
            </NativeTabs.Trigger>
            <NativeTabs.Trigger name="(more)">
                <Icon sf={{ default: 'person', selected: 'person' }} />
                <Label>Profile</Label>
            </NativeTabs.Trigger>
        </>
    );
}

const VendorTabs = () => {
    return (
        <>
            <NativeTabs.Trigger name="(map)">
                <Icon sf={{ default: 'map', selected: 'map.fill' }} />
                <Label>Map</Label>
            </NativeTabs.Trigger>
            <NativeTabs.Trigger name="(chat)">
                <Icon sf={{ default: 'ellipses.bubble', selected: 'ellipses.bubble.fill' }} />
                <Label>Chat</Label>
            </NativeTabs.Trigger>
            <NativeTabs.Trigger name="(more)">
                <Icon sf={{ default: 'ellipsis', selected: 'ellipsis' }} />
                <Label>More</Label>
            </NativeTabs.Trigger>
        </>
    );
}

const UserTabs = () => {
    return (
        <>
            <NativeTabs.Trigger name="(map)">
                <Icon sf={{ default: 'map', selected: 'map.fill' }} />
                <Label>Map</Label>
            </NativeTabs.Trigger>
            <NativeTabs.Trigger name="(chat)">
                <Icon sf={{ default: 'ellipses.bubble', selected: 'ellipses.bubble.fill' }} />
                <Label>Chat</Label>
            </NativeTabs.Trigger>
            <NativeTabs.Trigger name="(more)">
                <Icon sf={{ default: 'ellipsis', selected: 'ellipsis' }} />
                <Label>More</Label>
            </NativeTabs.Trigger>
        </>
    );
}


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
        <NativeTabs minimizeBehavior='automatic' backgroundColor={"#ffffff"}>
            <NativeTabs.Trigger name="(home)">
                <Icon sf={{ default: 'house', selected: 'house.fill' }} />
                <Label>Home</Label>
            </NativeTabs.Trigger>
            <NativeTabs.Trigger name="(map)">
                <Icon sf={{ default: isAdmin ? 'message' : 'map', selected: isAdmin ? 'message.fill' : 'map.fill' }} />
                <Label>{isAdmin ? 'Messages' : 'Map'}</Label>
            </NativeTabs.Trigger>
            <NativeTabs.Trigger name="(chat)">
                <Icon sf={{ default: isAdmin ? 'chart.bar' : 'ellipses.bubble', selected: isAdmin ? 'chart.bar.fill' : 'ellipses.bubble.fill' }} />
                <Label>{isAdmin ? 'Analytics' : 'Chat'}</Label>
            </NativeTabs.Trigger>
            <NativeTabs.Trigger name="(more)">
                <Icon sf={{ default: isAdmin ? 'person' : 'ellipsis', selected: isAdmin ? 'person' : 'ellipsis' }} />
                <Label>{isAdmin ? 'Profile' : 'More'}</Label>
            </NativeTabs.Trigger>
        </NativeTabs>
    );

}
