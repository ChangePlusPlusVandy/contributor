import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Loader2 } from "lucide-react";
import { Header } from "@/components/Header";
import ResourceModal from "@/components/ResourceModal";
import { useBookmarks } from "@/providers/bookmarks";
import { useApi } from "@/lib/api";
import { getCurrentPosition, type Coords } from "@/lib/location";

export default function Bookmarks() {
    const { bookmarkedOrgNames } = useBookmarks();
    const { makeRequest } = useApi();
    const navigate = useNavigate();
    const [location, setLocation] = useState<Coords | null>(null);
    const [resolvedResources, setResolvedResources] = useState<Resource[] | undefined>(undefined);

    useEffect(() => {
        getCurrentPosition().then(setLocation);
    }, []);

    useEffect(() => {
        if (bookmarkedOrgNames.length === 0) {
            setResolvedResources([]);
            return;
        }
        let cancelled = false;
        setResolvedResources(undefined);
        makeRequest("resources/", { method: "GET" }).then((result) => {
            if (cancelled) return;
            if (result.error != null) {
                setResolvedResources([]);
                return;
            }
            const raw = result.resources;
            const list = Array.isArray(raw)
                ? raw.filter((r: unknown): r is Resource => r != null && typeof r === "object")
                : [];
            const byName = new Map(list.map((r: Resource) => [r.org_name, r]));
            const ordered = bookmarkedOrgNames
                .map((name) => byName.get(name))
                .filter((r): r is Resource => r != null);
            setResolvedResources(ordered);
        });
        return () => {
            cancelled = true;
        };
    }, [bookmarkedOrgNames]);

    const isEmpty = bookmarkedOrgNames.length === 0;
    const isLoading = !isEmpty && resolvedResources === undefined;

    return (
        <div className="flex min-h-full flex-col bg-[#F8F8F8]">
            <Header />
            <div className="mt-[10px]" />
            <div className="mb-[12px] flex flex-row items-center px-[10px]">
                <button type="button" onClick={() => navigate(-1)} className="p-[2px]" aria-label="Back">
                    <ChevronLeft size={24} color="#000" />
                </button>
                <h1 className="font-lexend-semibold ml-[4px] text-[18px]">Bookmarks</h1>
            </div>
            {isEmpty ? (
                <div className="flex flex-1 items-center justify-center px-[24px]">
                    <p className="font-lexend-medium ml-[2px] text-center text-[14px] opacity-50">
                        No bookmarks yet. Tap the bookmark icon on a resource to save it here.
                    </p>
                </div>
            ) : isLoading ? (
                <div className="flex flex-1 items-center justify-center">
                    <Loader2 size={36} color="#2B84E9" className="animate-spin" />
                </div>
            ) : resolvedResources?.length === 0 ? (
                <div className="flex flex-1 items-center justify-center px-[24px]">
                    <p className="font-lexend-medium ml-[2px] text-center text-[14px] opacity-50">
                        Could not load bookmarked resources. Refresh or try again later.
                    </p>
                </div>
            ) : (
                <div className="px-[10px] pb-[20px]">
                    {resolvedResources!.map((resource, index) => (
                        <div
                            key={(resource as Resource & { _id?: string })._id ?? `bookmark-${index}-${resource.org_name}`}
                            className="mb-[12px]"
                        >
                            <ResourceModal
                                absolute={false}
                                modalResource={resource}
                                closeModalResource={() => {}}
                                location={location}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
