import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import debounce from "lodash.debounce";
import MapComponent, { resourceCoords } from "@/components/MapComponent";
import ResourceModal from "@/components/ResourceModal";
import { useApi } from "@/lib/api";
import { clamp } from "@/lib/utils";
import { getCurrentPosition, type Coords } from "@/lib/location";
import logo from "@/assets/images/logo-svg.svg";
import searchIcon from "@/assets/images/search.svg";
import pinFillIcon from "@/assets/images/pin-fill.svg";
import filterIcon from "@/assets/images/filter.svg";

const CATEGORY_SUBCATEGORIES: Record<Categories, string[]> = {
    "Urgent Needs": ["Food", "Emergency Shelter", "Housing", "Personal Care", "Rent + Utilities Assistance"],
    "Health and Wellness": ["Medical Care", "Mental Health", "Addiction Services", "Nursing Homes + Hospice", "Dental and Hearing", "HIV, PReP, & HEP C"],
    "Family and Pets": ["Tutoring + Mentoring", "Childcare", "Family Support", "Pet Help"],
    "Specialized Assistance": [
        "Seniors + People with Disabilities", "Veterans", "LGBTQ+", "Immigrants + Refugees", "Formerly Incarcerated"
    ],
    "Get Help": [
        "Legal Aid", "Domestic Violence", "Sexual Assault", "Advocacy", "ID's, Birth Certificates & Social Services", "Outside of Davidson County"
    ],
    "Find Work": ["Phones", "Jobs + Job Training", "Adult Education", "Arts", "Transporation"]
};

const FilterButton = ({ title, width, height, isPressed, toggleFilter, toggleOther, textSize = 12, onPress = () => null }: { title: string, width?: number, height: number, isPressed: boolean, toggleFilter?: (category: Categories) => void, toggleOther?: () => void, textSize?: number, onPress?: () => void }) => {

    const textRef = useRef<HTMLSpanElement>(null);

    // textSize is the starting size; long labels step down until they fit the button's box.
    useLayoutEffect(() => {
        const text = textRef.current;
        const button = text?.parentElement;
        if (!text || !button) return;

        const fit = () => {
            let size = textSize;
            text.style.fontSize = `${size}px`;
            while (size > 6 && (text.scrollHeight > button.clientHeight || text.scrollWidth > text.clientWidth)) {
                size -= 0.5;
                text.style.fontSize = `${size}px`;
            }
        };

        fit();
        const observer = new ResizeObserver(fit);
        observer.observe(button);
        return () => observer.disconnect();
    }, [title, textSize]);

    return (
        <button
            type="button"
            onClick={() => { onPress?.(); toggleFilter?.(title as Categories); toggleOther?.(); }}
            className="flex items-center justify-center rounded-[5px] px-[3px] shadow-[0_0_4px_rgba(0,0,0,0.25)] transition-[background-color,transform] duration-300 active:scale-90"
            style={{ width: width ?? "100%", height, backgroundColor: isPressed ? "#2B84E999" : "#ffffff" }}
        >
            <span ref={textRef} className="font-lexend-medium w-full text-center leading-tight" style={{ fontSize: textSize }}>{title}</span>
        </button>
    );

}

const TopPanel = ({ resources, location, setAnimateTo }: { resources: Resource[], location: Coords | null, setAnimateTo: (longitude: number, latitude: number) => void }) => {

    const [open, setOpen] = useState<boolean>(false);

    return (
        <div
            className="absolute inset-x-0 top-full z-20 flex flex-col overflow-hidden rounded-b-[20px] bg-[#F8F8F8] transition-[height] duration-300"
            style={{ height: open ? "60vh" : 30 }}
        >
            <div className="flex flex-1 flex-col items-center overflow-y-auto">
                <div className="h-[22px] shrink-0">
                    <p className="font-lexend text-[10px] text-[#00000033]">Double-click an organization to view it on the map</p>
                </div>
                {
                    resources.map((val, key) => (
                        <div
                            key={key}
                            className="mx-[10px] mb-[10px] w-[calc(100%-20px)] cursor-pointer"
                            onDoubleClick={() => { const c = resourceCoords(val); if (c) { setAnimateTo(c.longitude, c.latitude); setOpen(false); } }}
                        >
                            <ResourceModal absolute={false} modalResource={val} closeModalResource={() => { }} location={location} />
                        </div>
                    ))
                }
            </div>
            <button type="button" className="relative mt-auto h-[30px] w-full shrink-0" onClick={() => setOpen(prev => !prev)}>
                <span className="font-lexend absolute bottom-[13px] left-1/2 -translate-x-1/2 text-[10px] text-[#00000033]">View results</span>
                <span className="absolute bottom-[7px] left-1/2 h-[3px] w-[50px] -translate-x-1/2 bg-[#D9D9D9]"></span>
            </button>
        </div>
    );
}

export default function MapPage() {

    const [mapData, setMapData] = useState<Resource[] | undefined>(undefined);
    const [activeVendors, setActiveVendors] = useState<ActiveVendor[]>([]);

    const [showFilter, setShowFilter] = useState<boolean>(false);
    const [distance, setDistance] = useState<number>(20);
    const [distanceText, setDistanceText] = useState<string>("20");
    const [selectedCategory, setSelectedCategory] = useState<Categories | null>(null);
    const [subcategoryFilter, setSubcategoryFilter] = useState<string | null>(null);
    const [idRequired, setIDRequired] = useState<boolean>(false);
    const [location, setLocation] = useState<Coords | null>(null);
    const [animateTo, setAnimateTo] = useState<Coords | null>(null);
    const [search, setSearch] = useState<string>("");
    const [vendorsOnly, setVendorsOnly] = useState<boolean>(false);

    const onSearchChange = useCallback(debounce((val: string) => setSearch(val), 400), []);
    const onSliderChange = useCallback(debounce((val: number) => setDistance(val), 400), []);

    const { makeRequest } = useApi();

    useEffect(() => {
        makeRequest("resources/", { method: "GET" }).then((result) => {
            if (result.error != null) { setMapData([]); return; }
            const raw = result.resources;
            const list = Array.isArray(raw) ? raw.filter((r: unknown): r is Resource => r != null && typeof r === "object") : [];
            setMapData(list);
        });
        makeRequest("vendors/active").then((result) => {
            if (!result.error) setActiveVendors(result.vendors ?? []);
        });
        getCurrentPosition().then(setLocation);
    }, []);

    const filteredMapData = useMemo(() => {
        if (!mapData) return [];

        return mapData.filter((resource) => {
            if (resource == null || typeof resource !== "object") return false;
            const name = resource.org_name ?? "";
            const categoryMatch = selectedCategory !== null ? resource.category === selectedCategory : true;

            let subcategoryMatch = true;
            if (subcategoryFilter && resource.category === selectedCategory) {
                subcategoryMatch = name.toLowerCase().includes(subcategoryFilter.toLowerCase());
            }

            return categoryMatch &&
                subcategoryMatch &&
                (idRequired ? !resource.id_required : true) &&
                (search !== ""
                    ? name.toLowerCase().includes(search.toLowerCase())
                    : true);
        });
    }, [selectedCategory, subcategoryFilter, idRequired, mapData, search]);

    const toggleFilter = (category: Categories) => {
        if (selectedCategory === category) {
            setSelectedCategory(null);
            setSubcategoryFilter(null);
        } else {
            setSelectedCategory(category);
            setSubcategoryFilter(null);
        }
    }

    const toggleSubcategory = (subcategory: string) => {
        if (subcategoryFilter === subcategory) {
            setSubcategoryFilter(null);
        }
        else {
            setSubcategoryFilter(subcategory);
        }
    }

    // Grows back into the layout's tab-bar clearance so the map runs under the floating bar.
    return (
        <div className="flex h-[calc(100%_+_var(--tab-bar-clearance))] -mb-[var(--tab-bar-clearance)] flex-col bg-[#F8F8F8] md:mb-0 md:h-full">
            <div className="relative z-20 w-full pb-[10px]">
                <div className="flex h-[45px] flex-row items-center">
                    <img src={logo} alt="" className="ml-[11px] mr-[10px] h-[42px] w-[42px] object-contain" />
                    <div className="mr-[11px] h-[33px] w-[278px] max-w-[calc(100%-80px)]">
                        <div className="flex h-full w-full flex-row items-center rounded-[15px] bg-[#d9d9d980]">
                            <img src={searchIcon} alt="" className="ml-[8px] h-[17px] w-[17px] object-contain" />
                            <input
                                type="search"
                                onChange={(e) => onSearchChange(e.target.value)}
                                className="font-lexend-medium ml-[6px] w-[85%] bg-transparent text-[14px] outline-none placeholder:text-[#00000059]"
                                placeholder="Search resources"
                            />
                        </div>
                    </div>
                </div>
                <div className="mr-[10px] mt-[6px] flex flex-row items-center justify-between">
                    <p className="font-lexend-medium ml-[12px]">Resources near you</p>
                    <div className="flex flex-row items-start">
                        <img src={pinFillIcon} alt="" className="h-[24px] w-[24px] self-start object-contain" />
                        <div className="mr-[3px]">
                            <p className="font-lexend-medium text-right text-[14px] leading-[17px] text-[#2B84E9]">Nashville, TN</p>
                            <p className="font-lexend-medium -mt-[3px] text-right text-[10px] leading-[12px] text-[#2B84E9]">Distance - {distance} miles</p>
                        </div>
                        <button type="button" onClick={() => setShowFilter(prev => !prev)} aria-label="Toggle filters">
                            <img src={filterIcon} alt="" className="h-[24px] w-[24px] object-contain" />
                        </button>
                    </div>
                </div>
                <TopPanel resources={filteredMapData} location={location} setAnimateTo={(longitude, latitude) => setAnimateTo({ longitude, latitude })} />
            </div>
            <div className="relative flex-1">
                {
                    showFilter && (
                        <div className="animate-fade-in absolute inset-x-0 top-0 z-30 max-h-[65vh] overflow-y-auto bg-[#F8F8F8] px-[40px] pb-[20px]">
                            <p className="font-lexend-medium text-[14px]">Distance</p>
                            <p className="font-lexend-medium text-[10px] text-[#767676]">Only show me resources within a specific distance</p>
                            <input
                                type="range"
                                min={1}
                                max={100}
                                step={1}
                                defaultValue={distance}
                                onChange={(e) => onSliderChange(Number(e.target.value))}
                                className="h-[35px] w-full accent-[#2B84E9]"
                            />
                            <div className="flex flex-row items-center justify-between">
                                <p className="font-lexend-medium -mt-[3px] text-[10px] text-[#767676]">1</p>
                                <p className="font-lexend-medium -mt-[3px] text-[10px] text-[#767676]">100</p>
                            </div>
                            <div className="mt-[7px] w-full rounded-[5px] bg-[#D9D9D9] px-[8px] py-[6px]">
                                <p className="font-lexend-medium text-[10px] text-[#767676]">Enter distance (miles)</p>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    placeholder="1-100"
                                    value={distanceText}
                                    onChange={(e) => {
                                        const text = e.target.value;
                                        setDistanceText(text);
                                        const num = Number(text);
                                        if (!isNaN(num)) {
                                            setDistance(clamp(Math.round(num), 1, 100));
                                        }
                                    }}
                                    className="w-full bg-transparent outline-none"
                                />
                            </div>
                            <div className="mt-[7px] flex h-[26px] flex-row items-center">
                                <p className="font-lexend-medium text-[14px]">Filter</p>
                            </div>
                            <div className="mt-[8px] grid grid-cols-2 gap-[10px]">
                                <FilterButton title="ID Not Required" isPressed={idRequired} toggleOther={() => setIDRequired(v => !v)} height={35} />
                                <FilterButton title="Vendors Only" isPressed={vendorsOnly} toggleOther={() => setVendorsOnly(v => !v)} height={35} />
                            </div>
                            <div className="mt-[7px] flex h-[26px] flex-row items-center">
                                <p className="font-lexend-medium text-[14px]">Category</p>
                            </div>
                            <div className="mt-[8px] grid grid-cols-3 gap-[9px]">
                                <FilterButton title="Urgent Needs" isPressed={selectedCategory === "Urgent Needs"} toggleFilter={toggleFilter} textSize={10} height={36} />
                                <FilterButton title="Health and Wellness" isPressed={selectedCategory === "Health and Wellness"} toggleFilter={toggleFilter} textSize={10} height={36} />
                                <FilterButton title="Family and Pets" isPressed={selectedCategory === "Family and Pets"} toggleFilter={toggleFilter} textSize={10} height={36} />
                                <FilterButton title="Specialized Assistance" isPressed={selectedCategory === "Specialized Assistance"} toggleFilter={toggleFilter} textSize={10} height={36} />
                                <FilterButton title="Find Work" isPressed={selectedCategory === "Find Work"} toggleFilter={toggleFilter} textSize={10} height={36} />
                                <FilterButton title="Get Help" isPressed={selectedCategory === "Get Help"} toggleFilter={toggleFilter} textSize={10} height={36} />
                            </div>
                            {selectedCategory !== null && CATEGORY_SUBCATEGORIES[selectedCategory] && (
                                <div className="mt-[12px]">
                                    <p className="font-lexend-medium mb-[8px] text-[14px]">Subcategory</p>
                                    <div className="animate-fade-in mb-[10px]">
                                        <div className="grid grid-cols-3 gap-[9px]">
                                            {CATEGORY_SUBCATEGORIES[selectedCategory].map((sub) => (
                                                <FilterButton
                                                    key={`${selectedCategory}-${sub}`}
                                                    title={sub}
                                                    isPressed={subcategoryFilter === sub}
                                                    toggleOther={() => toggleSubcategory(sub)}
                                                    textSize={9}
                                                    height={28}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                }
                <MapComponent mapData={vendorsOnly ? [] : filteredMapData} activeVendors={activeVendors} location={location} animateTo={animateTo} />
            </div>
        </div>
    );
}
