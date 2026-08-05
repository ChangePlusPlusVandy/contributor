import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Loader2 } from "lucide-react";
import { Header } from "@/components/Header";
import ResourceModal from "@/components/ResourceModal";
import { useBookmarks } from "@/providers/bookmarks";
import { useResources } from "@/lib/cache";
import { getCurrentPosition, type Coords } from "@/lib/location";

export default function Bookmarks() {
    const { bookmarkedOrgNames } = useBookmarks();
    const resources = useResources();
    const navigate = useNavigate();
    const [location, setLocation] = useState<Coords | null>(null);

    useEffect(() => {
        getCurrentPosition().then(setLocation);
    }, []);

    const resolvedResources = useMemo(() => {
        if (bookmarkedOrgNames.length === 0) return [];
        if (!resources) return undefined;
        const byName = new Map(resources.map((r) => [r.org_name, r]));
        return bookmarkedOrgNames
            .map((name) => byName.get(name))
            .filter((r): r is Resource => r != null);
    }, [resources, bookmarkedOrgNames]);

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
