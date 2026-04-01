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
import { AuthProvider } from '@/providers/auth';
import { BookmarksProvider } from '@/providers/bookmarks';
import { Layout } from "@/components/Layout";

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


	if (!loaded && !error) {
		return null;
	}
	else {
		return (
			<AuthProvider>
				<BookmarksProvider>
					<Layout/>
				</BookmarksProvider>
			</AuthProvider>
		);
	}
}
