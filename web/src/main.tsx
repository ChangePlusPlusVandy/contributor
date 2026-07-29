import "@fontsource/lexend/100.css";
import "@fontsource/lexend/200.css";
import "@fontsource/lexend/300.css";
import "@fontsource/lexend/400.css";
import "@fontsource/lexend/500.css";
import "@fontsource/lexend/600.css";
import "@fontsource/lexend/700.css";
import "@fontsource/lexend/800.css";
import "@fontsource/lexend/900.css";
import "leaflet/dist/leaflet.css";
import "./index.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/providers/auth";
import { BookmarksProvider } from "@/providers/bookmarks";
import App from "./App";

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<BrowserRouter>
			<AuthProvider>
				<BookmarksProvider>
					<App />
				</BookmarksProvider>
			</AuthProvider>
		</BrowserRouter>
	</StrictMode>
);
