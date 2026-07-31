import { useEffect, useState } from "react";
import { Link, createSearchParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { useAuth } from "@/providers/auth";
import { useAuthApi } from "@/lib/api";
import { URGENT_NEEDS_RESOURCES, HEALTH_WELLNESS_RESOURCES, FAMILY_PETS_RESOURCES, SPECIALIZED_RESOURCES, GET_HELP_RESOURCES, FIND_WORK_RESOURCES } from "@/constants/resources";

const SECTION_TO_CATEGORY: Record<string, string> = {
    "Urgent Needs": "Urgent Needs",
    "Health & Wellness": "Health and Wellness",
    "Family & Pets": "Family and Pets",
    "Specialized Assistance": "Specialized Assistance and Help",
    "Get Help": "Specialized Assistance and Help",
    "Find Work": "Find Work",
};

const ResourceTile = ({ resource, onClick }: { resource: CategoryTile; onClick?: () => void }) => {
    return (
        <button
            type="button"
            onClick={onClick}
            className="mr-[10px] flex h-[100px] w-[100px] shrink-0 flex-col items-center justify-start rounded-[12px] bg-white shadow-[2px_2px_4px_rgba(0,0,0,0.1)] transition-transform duration-150 active:scale-90"
        >
            <img src={resource.imageURL} alt={resource.name} loading="lazy" className="h-[70px] w-[70px] object-contain" />
            <span className="font-lexend-medium px-[2px] text-center text-[10px] leading-[12px]">{resource.name}</span>
        </button>
    );
}

const ResourceSection = ({ title, resources }: { title: string, resources: CategoryTile[] | undefined }) => {

    const navigate = useNavigate();
    const categoryFilter = SECTION_TO_CATEGORY[title] ?? title;

    const navigateToCategory = (_title: string) => {
        navigate(`/category?${createSearchParams({ title: _title, filter: categoryFilter })}`);
    };

    return (
        <section className="mb-[36px] ml-[10px]">
            <div className="flex w-full flex-row items-center justify-between">
                <h2 className="font-lexend-semibold mb-[12px] text-[18px]">{title}</h2>
            </div>
            <div className="flex flex-row items-center overflow-x-auto py-[6px] [scrollbar-width:none]">
                {
                    resources?.map((resource, key) => (
                        <ResourceTile resource={resource} key={key} onClick={() => navigateToCategory(resource.name)} />
                    ))
                }
            </div>
        </section>
    );

}

const BookmarksLink = () => {
    return (
        <Link
            to="/bookmarks"
            className="mx-[10px] mb-[20px] flex h-[56px] flex-row items-center rounded-[12px] bg-white px-[10px] shadow-[2px_2px_4px_rgba(0,0,0,0.1)] transition-transform duration-150 active:scale-[0.97]"
        >
            <span className="font-lexend-semibold ml-[10px] text-[15px] text-[#2B84E9]">Bookmarks</span>
        </Link>
    );
};

const ResourceSections = () => (
    <>
        <BookmarksLink />
        <ResourceSection title="Urgent Needs" resources={URGENT_NEEDS_RESOURCES} />
        <ResourceSection title="Health & Wellness" resources={HEALTH_WELLNESS_RESOURCES} />
        <ResourceSection title="Family & Pets" resources={FAMILY_PETS_RESOURCES} />
        <ResourceSection title="Specialized Assistance" resources={SPECIALIZED_RESOURCES} />
        <ResourceSection title="Get Help" resources={GET_HELP_RESOURCES} />
        <ResourceSection title="Find Work & Get Connected" resources={FIND_WORK_RESOURCES} />
    </>
);

const UserHome = () => {
    return (
        <div className="bg-[#F8F8F8]">
            <Header />
            <div className="mb-1.5 mt-1.5 flex h-[100px] w-full flex-row items-center justify-start">
                <div className="ml-[10px]">
                    <h1 className="font-lexend-bold text-[29px] text-[#2B84E9]">Middle Tennesse</h1>
                    <h1 className="font-lexend-bold -mt-1 text-[29px] text-[#2B84E9]">Resource Directory</h1>
                </div>
            </div>
            <ResourceSections />
        </div>
    );
}

const AdminHome = () => {

    const { user } = useAuth();
    const { makeRequest } = useAuthApi();
    const [numPendingResources, setNumPendingResources] = useState<number>(0);

    useEffect(() => {
        makeRequest("resources/pending/").then((result) => {
            if (result.resources) setNumPendingResources(result.resources.length);
        });
    }, []);

    return (
        <div className="bg-[#F8F8F8]">
            <Header />
            <div className="flex flex-row flex-wrap gap-3 truncate p-[10px]">
                <span className="font-lexend-bold text-[29px]">Welcome Back,</span>
                <span className="font-lexend-bold text-[29px] text-[#2B84E9]">{user?.name}</span>
            </div>
            <Link to="/more" className="mx-2 mb-[20px] mt-[5px] flex h-[66px] flex-col justify-center rounded-[20px] bg-white px-4 shadow-sm">
                <p className="font-lexend-medium text-[17px]">
                    You have <span className="text-[#2B84E9]">{numPendingResources}</span> new
                    {numPendingResources == 1 ? " resource" : " resources"} awaiting for approval
                </p>
            </Link>
            <ResourceSections />
        </div>
    );
}

const VendorHome = () => {
    return (
        <div className="bg-[#F8F8F8]">
            <Header />
            <div className="mb-3 mt-1.5 flex h-[100px] w-full flex-row items-center justify-start">
                <div className="ml-[10px]">
                    <h1 className="font-lexend-bold text-[29px] text-[#2B84E9]">Middle Tennesse</h1>
                    <h1 className="font-lexend-bold -mt-1 text-[29px] text-[#2B84E9]">Resource Directory</h1>
                </div>
            </div>
            <ResourceSections />
        </div>
    );
}

export default function Home() {

    const { user } = useAuth();

    if (user?.role === "admin") return <AdminHome />;
    if (user?.role === "vendor") return <VendorHome />;
    return <UserHome />;

}
