import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, Loader2 } from "lucide-react";
import { Header } from "@/components/Header";
import ResourceModal from "@/components/ResourceModal";
import { useApi } from "@/lib/api";
import { getCurrentPosition, type Coords } from "@/lib/location";

export default function Category() {
    const [searchParams] = useSearchParams();
    const category = searchParams.get("category") ?? "";
    const subcategory = searchParams.get("subcategory") ?? "";
    const navigate = useNavigate();
    const [location, setLocation] = useState<Coords | null>(null);

    useEffect(() => {
        getCurrentPosition().then(setLocation);
    }, []);

    const { makeRequest } = useApi();

    const [resources, setResources] = useState<Resource[] | undefined>(undefined);
    useEffect(() => {
        const query = new URLSearchParams();
        if (category) query.set("category", category);
        if (subcategory) query.set("subcategory", subcategory);

        makeRequest(`resources/?${query}`, {
            method: "GET"
        }).then((result) => {
            if (result.error != null) {
                setResources([]);
                return;
            }
            const raw = result.resources;
            setResources(
                Array.isArray(raw)
                    ? raw.filter((r: unknown): r is Resource => r != null && typeof r === "object")
                    : []
            );
        });
    }, [category, subcategory]);

    // Groups are sorted alphabetically; resources without a group collect in a trailing section.
    const sections = useMemo(() => {
        if (!resources) return [];

        const buckets = new Map<string, Resource[]>();
        const ungrouped: Resource[] = [];

        for (const resource of resources) {
            const group = resource.group?.trim();
            if (!group) {
                ungrouped.push(resource);
                continue;
            }
            const bucket = buckets.get(group);
            if (bucket) bucket.push(resource);
            else buckets.set(group, [resource]);
        }

        const sorted = [...buckets.entries()].sort(([a], [b]) => a.localeCompare(b));
        if (ungrouped.length > 0) sorted.push(["Other", ungrouped]);
        return sorted;
    }, [resources]);

    return (
        <div className="flex min-h-full flex-col bg-[#F8F8F8]">
            <Header />
            <div className="mt-[10px]" />
            <div className="mb-[12px] flex flex-row items-center px-[10px]">
                <button type="button" onClick={() => navigate(-1)} className="p-[2px]" aria-label="Back">
                    <ChevronLeft size={24} color="#000" />
                </button>
                <h1 className="font-lexend-semibold ml-[4px] text-[18px]">{subcategory}</h1>
            </div>
            {resources === undefined ? (
                <div className="flex flex-1 items-center justify-center">
                    <Loader2 size={36} className="animate-spin" />
                </div>
            ) : resources?.length === 0 ? (
                <div className="flex flex-1 items-center justify-center px-[24px]">
                    <p className="font-lexend-medium ml-[2px] text-center text-[14px] opacity-50">
                        No resources found for this category.
                    </p>
                </div>
            ) : (
                <div className="px-[10px] pb-[20px]">
                    {sections.map(([group, groupResources]) => (
                        <section key={group} className="mt-[18px] first:mt-0">
                            <h2 className="font-lexend-semibold mb-[10px] text-[17px]">{group}</h2>
                            {groupResources.map((resource: Resource, index) => (
                                <div
                                    key={(resource as Resource & { _id?: string })._id ?? `category-resource-${index}`}
                                    className="mb-[12px]"
                                >
                                    <ResourceModal
                                        absolute={false}
                                        showGroup={false}
                                        modalResource={resource}
                                        closeModalResource={() => { }}
                                        location={location}
                                    />
                                </div>
                            ))}
                        </section>
                    ))}
                </div>
            )}
        </div>
    );
}
