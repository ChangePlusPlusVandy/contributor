import { useEffect, useState } from "react";
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
                    {resources?.map((resource: Resource, index) => (
                        <div
                            key={(resource as Resource & { _id?: string })._id ?? `category-resource-${index}`}
                            className="mb-[12px]"
                        >
                            <ResourceModal
                                absolute={false}
                                modalResource={resource}
                                closeModalResource={() => { }}
                                location={location}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
