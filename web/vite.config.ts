import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

export default defineConfig({
	plugins: [
		react(),
		VitePWA({
			registerType: "autoUpdate",
			includeAssets: ["favicon.png"],
			manifest: {
				name: "Where To Turn In Nashville",
				short_name: "WTTIN",
				description: "Middle Tennessee Resource Directory",
				theme_color: "#F8F8F8",
				background_color: "#F8F8F8",
				display: "standalone",
				start_url: "/",
				icons: [
					{ src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
					{ src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
					{ src: "pwa-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
				]
			},
			workbox: {
				// Static assets are precached; API calls (cross-origin VITE_API_URL) are
				// intentionally not cached — resource data must always be fresh.
				globPatterns: ["**/*.{js,css,html,svg,png,webp,woff2}"],
				maximumFileSizeToCacheInBytes: 4 * 1024 * 1024
			}
		})
	],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "src")
		}
	}
});
