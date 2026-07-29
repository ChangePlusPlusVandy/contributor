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

export default function App() {
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
				<Route path="*" element={<Navigate to="/" replace />} />
			</Route>
		</Routes>
	);
}
