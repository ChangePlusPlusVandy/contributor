import logo from "@/assets/images/logo-svg.svg";

/** Shared "WHERE TO TURN IN NASHVILLE" page header. */
export function Header() {
    return (
        <header className="sticky top-0 z-30 flex h-[52px] w-full flex-row items-center justify-start bg-[#F8F8F8] pb-[10px] pt-[7px]">
            <img src={logo} alt="Where To Turn In Nashville logo" className="ml-[11px] mr-[10px] h-[42px] w-[42px] object-contain" />
            <div>
                <p className="font-lexend-semibold text-[18px] leading-snug">WHERE TO TURN</p>
                <p className="font-lexend-semibold text-[18px] leading-snug">IN NASHVILLE</p>
            </div>
        </header>
    );
}
