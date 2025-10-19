import { NativeTabs, Icon, Label, Badge } from 'expo-router/unstable-native-tabs';
import "../global.css"

export default function RootLayout() {
	return (
		<NativeTabs minimizeBehavior='automatic'>
			<NativeTabs.Trigger name="(chat)">
				<Label>Chat</Label>
				<Icon sf={{ default: 'ellipses.bubble', selected: 'ellipses.bubble.fill' }} drawable="custom_android_drawable" />
			</NativeTabs.Trigger>
			<NativeTabs.Trigger name="(map)">
				<Icon sf={{ default: 'map', selected: 'map.fill' }} drawable="custom_settings_drawable" />
				<Label>Map</Label>
			</NativeTabs.Trigger>
			<NativeTabs.Trigger name="(home)">
				<Icon sf={{ default: 'house', selected: 'house.fill' }} drawable="custom_settings_drawable" />
				<Label>Home</Label>
			</NativeTabs.Trigger>
			<NativeTabs.Trigger name="(alerts)">
				<Icon sf={{ default: 'bell', selected: 'bell.fill' }} drawable="custom_settings_drawable" />
				<Label>Alerts</Label>
				<Badge />
			</NativeTabs.Trigger>
			<NativeTabs.Trigger name="(more)">
				<Icon sf={{ default: 'ellipsis', selected: 'ellipsis'}} drawable="custom_settings_drawable" />
				<Label>More</Label>
			</NativeTabs.Trigger>
		</NativeTabs>
	);
}
