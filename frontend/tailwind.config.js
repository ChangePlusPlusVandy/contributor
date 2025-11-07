/** @type {import('tailwindcss').Config} */
module.exports = {
	content: [
		"./app/**/*.{js,jsx,ts,tsx}",
		"./components/**/*.{js,jsx,ts,tsx}",
	],
	presets: [require("nativewind/preset")],
	theme: {
		extend: {
			fontFamily: {
				sans: ["Lexend_400Regular"],
				lexend: ["Lexend_400Regular"],
				"lexend-thin": ["Lexend_100Thin"],
				"lexend-extralight": ["Lexend_200ExtraLight"],
				"lexend-light": ["Lexend_300Light"],
				"lexend-medium": ["Lexend_500Medium"],
				"lexend-semibold": ["Lexend_600SemiBold"],
				"lexend-bold": ["Lexend_700Bold"],
				"lexend-extrabold": ["Lexend_800ExtraBold"],
				"lexend-black": ["Lexend_900Black"],
			}
		},
	},
	plugins: [],
}

