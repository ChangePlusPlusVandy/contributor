import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";

const cardShadow = "shadow-[2px_2px_4px_rgba(0,0,0,0.2)]";

const PLATFORMS = [
    {
        name: "iPhone / iPad",
        steps: [
            "Open Where To Turn In Nashville in Safari",
            "Tap the Share button",
            "Choose Add to Home Screen",
            "Tap Add",
        ],
    },
    {
        name: "Android",
        steps: [
            "Open Where To Turn In Nashville in Chrome",
            "Tap Install app if prompted, or open the browser menu",
            "Choose Add to Home Screen or Install app",
            "Confirm Install",
        ],
    },
];

export default function PwaInstructions({ onDismiss }: { onDismiss?: () => void }) {

    const navigate = useNavigate();

    return (
        <div
            className={`bg-[#F8F8F8] ${onDismiss ? "h-dvh overflow-y-auto" : ""}`}
            style={onDismiss ? { paddingTop: "env(safe-area-inset-top)" } : undefined}
        >
            <Header />
            <div className="px-[24px] pb-[40px] pt-[16px]">
                <h2 className="font-lexend-semibold mb-[10px] text-[18px]">Add to Home Screen</h2>
                <p className="font-lexend-bold mb-[8px] text-[13px]">Highly recommended for better user experience.</p>
                <p className="font-lexend-medium mb-[18px] text-[13px] opacity-60">
                    This website can be added to your home screen and opened just like an app. To set it up, follow the steps for your device below.
                </p>
                {PLATFORMS.map(({ name, steps }) => (
                    <div key={name} className={`mb-[18px] rounded-[5px] bg-white p-[16px] ${cardShadow}`}>
                        <p className="font-lexend-bold mb-[10px] text-[15px]">{name}</p>
                        <ol>
                            {steps.map((step, index) => (
                                <li key={step} className="mb-[8px] flex flex-row gap-[10px] last:mb-0">
                                    <span className="font-lexend-medium flex h-[20px] w-[20px] flex-none items-center justify-center rounded-full bg-[#2B84E9] text-[11px] text-white">
                                        {index + 1}
                                    </span>
                                    <span className="font-lexend-medium text-[13px] opacity-60">{step}</span>
                                </li>
                            ))}
                        </ol>
                    </div>
                ))}
                <p className="font-lexend-medium text-[13px] mb-[8px] opacity-60">
                    The app will be added to your device's home screen. This can be undone at any time by holding the app icon and selecting Delete Bookmark.
                </p>
                <p className="font-lexend-medium text-[13px] opacity-60">
                    Each time you want to revisit the app, simply click the shortcut on your home screen instead of searching the URL.
                </p>
                {onDismiss ? (
                    <button
                        type="button"
                        onClick={onDismiss}
                        className="mt-[24px] flex h-[44px] w-full flex-row items-center justify-center rounded-[10px] bg-[#2B84E9] transition-transform duration-150 active:scale-95"
                    >
                        <p className="font-lexend-medium text-[14px] text-white">Continue to the site</p>
                    </button>
                ) : (
                    <button type="button" onClick={() => navigate(-1)} className="mt-[16px] block w-full text-center">
                        <span className="font-lexend-medium text-[14px] text-[#2B84E9]">Back</span>
                    </button>
                )}
            </div>
        </div>
    );

}
