import Animated, { useSharedValue, withSpring, useAnimatedStyle, withTiming, Easing, withDelay, FadeOut } from "react-native-reanimated";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function AnimatedLetter({ letter, delay }: { letter: string, delay: number }) {
    const translateY = useSharedValue(50);
    const opacity = useSharedValue(0);

    useEffect(() => {
        translateY.value = withDelay(
            delay,
            withSpring(0, { damping: 50, stiffness: 400, mass: 5 })
        );
        opacity.value = withDelay(
            delay,
            withTiming(1, { easing: Easing.inOut(Easing.quad) })
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
        opacity: opacity.value,
    }));

    return (
        <Animated.Text
            style={[animatedStyle, { fontFamily: "Parisienne_400Regular", lineHeight: 60 }]}
            className="text-5xl px-[3px]"
        >
            {letter}
        </Animated.Text>
    );
}

export default function StartupAnimation({ onFinish }: { onFinish?: () => void }) {

    const animationDuration = 100 * "WTTIN".length + 2000;

    useEffect(() => {

        const timer = setTimeout(() => {

            if (onFinish) onFinish();

        }, animationDuration);

        return () => clearTimeout(timer);
    }, []);


    return (
        <>
            <Animated.View 
                style={{
                    position: "absolute",
                    top: 0,
                    bottom: 0,
                    left: 0,
                    right: 0,
                    backgroundColor: "#ffffff",
                    zIndex: 1000,
                }}
                exiting={FadeOut.duration(1000)}
            >
                <SafeAreaView className="h-full w-full bg-transparent flex justify-center items-center">
                    <View
                        className="relative flex flex-row w-fit h-fit"
                    >
                        {"WTTIN".split("").map((l, key) => (
                            <AnimatedLetter letter={l} key={key} delay={100 * key} />
                        ))}
                    </View>
                </SafeAreaView>
            </Animated.View>
        </>
    );
}
