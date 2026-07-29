import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Header } from "@/components/Header";
import { useAuthApi } from "@/lib/api";

type Vendor = {
    vendor_id: string;
    name: string;
    is_clocked_in?: boolean;
};

export default function VendorList() {
    const navigate = useNavigate();
    const { makeRequest } = useAuthApi();
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        makeRequest("admin/vendors").then(data => {
            if (!data.error) {
                const sorted = (data.vendors ?? []).sort((a: Vendor, b: Vendor) =>
                    (b.is_clocked_in ? 1 : 0) - (a.is_clocked_in ? 1 : 0)
                );
                setVendors(sorted);
            }
            setLoading(false);
        });
    }, []);

    return (
        <div className="min-h-full bg-[#F8F8F8]">
            <Header />

            <div className="px-[24px] pb-[80px] pt-[16px]">
                <div className="mb-[16px] flex flex-row items-center justify-between">
                    <h1 className="font-lexend-semibold text-[18px]">Vendors</h1>
                    <button type="button" onClick={() => navigate(-1)}>
                        <span className="font-lexend-medium text-[14px] text-[#2B84E9]">Back</span>
                    </button>
                </div>

                {loading ? (
                    <Loader2 className="animate-spin" />
                ) : vendors.length === 0 ? (
                    <p className="font-lexend-medium text-[14px] opacity-50">No vendors found.</p>
                ) : (
                    <div>
                        {vendors.map(vendor => (
                            <div
                                key={vendor.vendor_id}
                                className="mb-[10px] flex flex-row items-center justify-between rounded-[10px] bg-white px-[16px] py-[14px] shadow-[2px_2px_4px_rgba(0,0,0,0.1)]"
                            >
                                <div>
                                    <p className="font-lexend-semibold text-[15px]">{vendor.name}</p>
                                    <p className="font-lexend-medium mt-[2px] text-[12px] opacity-50">ID: {vendor.vendor_id}</p>
                                </div>
                                <div
                                    className="rounded-full px-[10px] py-[4px]"
                                    style={{ backgroundColor: vendor.is_clocked_in ? "#dcfce7" : "#f1f5f9" }}
                                >
                                    <span
                                        className="font-lexend-medium text-[12px]"
                                        style={{ color: vendor.is_clocked_in ? "#16a34a" : "#64748b" }}
                                    >
                                        {vendor.is_clocked_in ? "Clocked In" : "Clocked Out"}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
