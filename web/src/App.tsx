import { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import Home from "@/pages/Home";
import Bookmarks from "@/pages/Bookmarks";
import Category from "@/pages/Category";
import Announcements from "@/pages/Announcements";
import MapPage from "@/pages/MapPage";
import More from "@/pages/More";
import Login from "@/pages/Login";
import ChangePassword from "@/pages/ChangePassword";
import VendorList from "@/pages/VendorList";
import PwaInstructions from "@/pages/PwaInstructions";

const PWA_INTRO_KEY = "wttinpwaintroseen";

function shouldShowPwaIntro() {
	try {
		if (localStorage.getItem(PWA_INTRO_KEY)) return false;
	} catch {
		// storage unavailable (private browsing) — the flag could never be written, so never nag
		return false;
	}
	const installed =
		window.matchMedia("(display-mode: standalone)").matches ||
		(window.navigator as { standalone?: boolean }).standalone === true;
	return !installed && window.matchMedia("(max-width: 767px)").matches;
}

export default function App() {

	// Rendered in place of the routes rather than as one, so no history entry is
	// pushed and a deep-linked first visit lands where it was headed on dismiss.
	const [showPwaIntro, setShowPwaIntro] = useState(shouldShowPwaIntro);

	const dismissPwaIntro = () => {
		try {
			localStorage.setItem(PWA_INTRO_KEY, "1");
		} catch {
			// nothing to do — the intro is suppressed for this session either way
		}
		setShowPwaIntro(false);
	};

	if (showPwaIntro) {
		return <PwaInstructions onDismiss={dismissPwaIntro} />;
	}
	return (
		<Routes>
			<Route element={<Layout />}>
				<Route path="/" element={<Home />} />
				<Route path="/bookmarks" element={<Bookmarks />} />
				<Route path="/category" element={<Category />} />
				<Route path="/map" element={<MapPage />} />
				<Route path="/announcements" element={<Announcements />} />
				<Route path="/more" element={<More />} />
				<Route path="/more/login" element={<Login />} />
				<Route path="/more/change-password" element={<ChangePassword />} />
				<Route path="/more/vendor-list" element={<VendorList />} />
				<Route path="/more/pwa" element={<PwaInstructions />} />
				<Route path="*" element={<Navigate to="/" replace />} />
			</Route>
		</Routes>
	);
}
