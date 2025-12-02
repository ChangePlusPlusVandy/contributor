import { useSafeAreaInsets } from "react-native-safe-area-context";
import { View, Text, KeyboardAvoidingView, TextInput, Pressable } from "react-native";
import { Image } from "expo-image";
import { Platform } from "react-native";
import { useEffect, useRef, useState } from "react";
import Animated, { FadeOut, FadeIn, Easing, useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { ScrollView } from "react-native";
import { Keyboard } from "react-native";

type MessageType = {
    role: "ai" | "user",
    content: string
}

const Message = ({ role, content }: MessageType) => {
    if (role === "user") {
        return (
            <Animated.View entering={FadeIn.duration(300).easing(Easing.inOut(Easing.quad))} className="p-[10px] max-w-[188px] bg-white border-solid border-2 border-black/10 rounded-[10px] mr-[19px] ml-auto mt-[17px]">
                <Text className="text-[14px]">{content}</Text>
            </Animated.View>
        );
    }
    else {
        return (
            <Animated.View entering={FadeIn.duration(300).easing(Easing.inOut(Easing.quad))} className="flex justify-start items-start flex-row mt-[17px] ml-[19px]">
                <Image source={require("../../assets/images/chatbot.svg")} style={{ width: 39, height: 39, marginRight: 8 }} contentFit="contain" />
                <View className="p-[10px] max-w-[210px] bg-[#E0F5FF] border-solid border-2 border-black/10 rounded-[10px]">
                    <Text className="text-[14px]">{content}</Text>
                </View>
            </Animated.View>
        );
    }
}

const Thinking = () => {

    const opacity = useSharedValue<number>(0);
    const style = useAnimatedStyle(() => ({
        opacity: opacity.value
    }));

    useEffect(() => {
        opacity.value = withRepeat(
            withSequence(
                withTiming(1, { duration: 2000, easing: Easing.out(Easing.quad) }),
                withTiming(0, { duration: 2000, easing: Easing.out(Easing.quad) })
            ),
            Infinity
        )
    }, []);

    return (
        <Animated.View exiting={FadeOut.duration(300).easing(Easing.inOut(Easing.quad))} className="mt-[17px] ml-[19px]">
            <Animated.View style={[style]}>
                <Image source={require("../../assets/images/chatbot.svg")} style={{ width: 39, height: 39, marginRight: 8 }} contentFit="contain" />
            </Animated.View>
        </Animated.View>
    );
}

export default function Chat() {

    const [chatting, setChatting] = useState<boolean>(false);
    const [chats, setChats] = useState<MessageType[]>([]);
    const [inputText, setInputText] = useState<string>("");
    const [thinking, setThinking] = useState<boolean>(false);

    const scrollViewRef = useRef<ScrollView | null>(null);
    const insets = useSafeAreaInsets();

    const aiLogic = () => {

        setChats(prev => (
            [
                ...prev,
                {
                    role: "ai",
                    content: "Can't help you with that."
                },
            ]
        ));

        setThinking(false);

    }

    const onEndEditing = () => {

        if (inputText === "" || thinking) return;

        setChats(prev => (
            [
                ...prev,
                {
                    role: "user",
                    content: inputText
                },
            ]
        ));

        setChatting(true);
        setInputText("");
        setThinking(true);
        
        Keyboard.dismiss();
        // scrollViewRef.current?.scrollToEnd({ animated: true });

        setTimeout(aiLogic, 5000);

    }

    const onPressOption = (option: string) => {

        setChats(prev => (
            [
                ...prev,
                {
                    role: "user",
                    content: option
                },
            ]
        ));
        
        setChatting(true);
        setThinking(true);

        setTimeout(aiLogic, 5000);

    }

    return (
        <View className="bg-[#F8F8F8] flex-1" style={{ paddingTop: insets.top }}>
            <Image source={require("../../assets/images/radial-gradient.png")} style={{ width: "100%", height: "100%", position: "absolute" }} contentFit="cover" />
            <View className="w-full flex justify-start items-center flex-row pb-[10px] mt-[7px] h-[45px]">
                <Image source={require("../../assets/images/logo-svg.svg")} style={{ width: 42, height: 42, marginLeft: 11, marginRight: 10 }} contentFit="contain"/>
                <View>
                    <Text className="font-lexend-semibold text-[20px]">WTTIN<Text className="font-lexend-light"> AI</Text></Text>
                </View>
                <Image source={require("../../assets/images/bell-pin.svg")} style={{ width: 37, height: 37, marginLeft: "auto", marginRight: 10 }} contentFit="contain" />
            </View>
            {
                chatting &&
                <Animated.View entering={FadeIn.duration(300).easing(Easing.inOut(Easing.quad))} className="flex-1 mb-[120px]">
                    <ScrollView ref={scrollViewRef} showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
                        {
                            chats?.map((chat, key) => (
                                <Message role={chat.role} content={chat.content} key={key}/>
                            ))
                        }
                        {
                            thinking && <Thinking/>
                        }
                    </ScrollView> 
                </Animated.View>
            }
            {
                !chatting && <Animated.View exiting={FadeOut.duration(300).easing(Easing.inOut(Easing.quad))} className="absolute top-[42%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col justify-center items-center">
                    <Image source={require("../../assets/images/chatbot.svg")} style={{ width: 83, height: 83, marginBottom: 20 }} contentFit="contain" />
                    <Text className="text-center font-lexend-semibold text-[20px]">Hello, how can I help you?</Text>
                    <Text className="text-center text-[12px] mt-[5px] opacity-60">Choose a prompt below or write your </Text>
                    <Text className="text-center text-[12px] opacity-60">own to start chatting.</Text>
                    <View className="flex flex-row justify-between items-center mt-[10px]">
                        <Pressable onPress={() => onPressOption("Nearby resources")}>
                            <View className="w-[140px] h-[77px] bg-[#FFFFFFB2] mr-[15px] rounded-[5px] border-solid border-[2px] border-black/10 flex justify-center items-center">
                                <Text className="text-[12px]">Nearby Resources</Text>
                            </View>
                        </Pressable>
                            <Pressable onPress={() => onPressOption("Nearby shelter")}>
                            <View className="w-[140px] h-[77px] bg-[#FFFFFFB2] rounded-[5px] border-solid border-[2px] border-black/10 flex justify-center items-center">
                                <Text className="text-[12px]">Nearby Shelter</Text>
                            </View>
                        </Pressable>
                    </View>
                </Animated.View>
            }
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="absolute bottom-[85px] w-[100%] px-[25px]">
                <View className="w-full h-[42px] rounded-[10px] border-[2px] border-black/10 bg-white/70 flex flex-row items-center pl-[13px] pr-[5px] mb-[10px]">
                    <TextInput onChangeText={(value) => setInputText(value)} value={inputText} onEndEditing={onEndEditing} placeholder="Ask a question" style={{ fontSize: 14, flex: 1 }}/>
                    <Pressable onPress={onEndEditing}>
                        <Image source={require("../../assets/images/send.svg")} style={{ width: 31, height: 31 }} contentFit="contain"/>
                    </Pressable>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}