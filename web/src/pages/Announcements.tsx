import { useCallback, useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { useAuth } from "@/providers/auth";
import { useAuthApi } from "@/lib/api";
import { useAnnouncements, type Announcement } from "@/lib/cache";

const AnnouncementCard = ({ item }: { item: Announcement }) => {
    const dateLabel = useMemo(() => {
        return new Date(item.createdAt).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    }, [item.createdAt]);

    return (
        <div className="mb-[12px] rounded-[12px] bg-white px-[14px] py-[14px] shadow-[2px_2px_4px_rgba(0,0,0,0.1)]">
            <p className="font-lexend-medium mb-[8px] text-[12px] opacity-50">{dateLabel}</p>
            <p className="font-lexend-medium text-[15px] leading-[22px]">{item.content}</p>
        </div>
    );
};

export default function Announcements() {
    const { user } = useAuth();
    const isAdmin = user?.role === "admin";
    const { announcements, addAnnouncement } = useAnnouncements();
    const [draft, setDraft] = useState("");
    const [posting, setPosting] = useState(false);
    const { makeRequest: authRequest } = useAuthApi();

    const sorted = useMemo(
        () => [...(announcements ?? [])].sort((a, b) => b.createdAt - a.createdAt),
        [announcements]
    );

    const post = useCallback(async () => {
        const trimmed = draft.trim();
        if (!trimmed) return;
        setPosting(true);
        try {
            const data = await authRequest("announcements/create", {
                method: "POST",
                body: JSON.stringify({ content: trimmed }),
            });
            if (data.error) { window.alert(`Error: ${data.error}`); return; }
            addAnnouncement({ id: data.id, content: trimmed, createdAt: new Date(data.created_at).getTime() });
            setDraft("");
        } finally {
            setPosting(false);
        }
    }, [draft]);

    const canPost = draft.trim().length > 0 && !posting;

    return (
        <div className="min-h-full bg-[#F8F8F8]">
            <Header />
            <div className="mt-[10px]" />
            <div className="px-[10px] pb-[20px]">
                {isAdmin && (
                    <div className="mb-[20px]">
                        <h2 className="font-lexend-semibold mb-[10px] ml-[2px] text-[18px]">New announcement</h2>
                        <div className="rounded-[12px] bg-white px-[14px] py-[12px] shadow-[2px_2px_4px_rgba(0,0,0,0.1)]">
                            <textarea
                                value={draft}
                                onChange={(e) => setDraft(e.target.value)}
                                placeholder="Write an announcement for the community…"
                                className="font-lexend-medium min-h-[100px] w-full resize-y bg-transparent text-[15px] placeholder-black/35 outline-none"
                            />
                            <div className="mt-[12px]">
                                <button
                                    type="button"
                                    onClick={post}
                                    disabled={!canPost}
                                    className="w-full rounded-[10px] bg-[#2B84E9] py-[12px] text-center transition-transform duration-150 active:scale-[0.97] disabled:opacity-45"
                                >
                                    <span className="font-lexend-semibold text-[15px] text-white">Post</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                <h2 className="font-lexend-semibold mb-[12px] ml-[2px] text-[18px]">Announcements</h2>
                {sorted.length === 0 ? (
                    <p className="font-lexend-medium ml-[2px] text-[14px] opacity-50">No announcements yet.</p>
                ) : (
                    sorted.map((item) => <AnnouncementCard key={item.id} item={item} />)
                )}
            </div>
        </div>
    );
}
