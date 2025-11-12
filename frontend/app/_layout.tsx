import { NativeTabs, Icon, Label, Badge } from 'expo-router/unstable-native-tabs';
import "../global.css"
import { useEffect } from 'react';

import {
	useFonts,
	Lexend_100Thin,
	Lexend_200ExtraLight,
	Lexend_300Light,
	Lexend_400Regular,
	Lexend_500Medium,
	Lexend_600SemiBold,
	Lexend_700Bold,
	Lexend_800ExtraBold,
	Lexend_900Black
} from "@expo-google-fonts/lexend";
import * as SplashScreen from "expo-splash-screen";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {

	const [loaded, error] = useFonts({
		Lexend_100Thin,
		Lexend_200ExtraLight,
		Lexend_300Light,
		Lexend_400Regular,
		Lexend_500Medium,
		Lexend_600SemiBold,
		Lexend_700Bold,
		Lexend_800ExtraBold,
		Lexend_900Black,
	});

	useEffect(() => {
		if (loaded || error) {
			setTimeout(() => SplashScreen.hideAsync(), 1000);
		}
	}, [loaded, error]);


	if (!loaded && !error) {
		return null;
	}
	else {
		return (
			<>
				<NativeTabs minimizeBehavior='automatic' backgroundColor={"#ffffff"}>
					<NativeTabs.Trigger name="(home)">
						<Icon sf={{ default: 'house', selected: 'house.fill' }} drawable="custom_settings_drawable" />
						<Label>Home</Label>
					</NativeTabs.Trigger>
					<NativeTabs.Trigger name="(map)">
						<Icon sf={{ default: 'map', selected: 'map.fill' }} drawable="custom_settings_drawable" />
						<Label>Map</Label>
					</NativeTabs.Trigger>
					<NativeTabs.Trigger name="(chat)">
						<Label>Chat</Label>
						<Icon sf={{ default: 'ellipses.bubble', selected: 'ellipses.bubble.fill' }} drawable="custom_android_drawable" />
					</NativeTabs.Trigger>
					<NativeTabs.Trigger name="(more)">
						<Icon sf={{ default: 'ellipsis', selected: 'ellipsis'}} drawable="custom_settings_drawable" />
						<Label>More</Label>
					</NativeTabs.Trigger>
				</NativeTabs>
			</>
		);
	}
}
