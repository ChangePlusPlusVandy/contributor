import logo from "@/assets/images/logo-svg.svg";

/** Shared "WHERE TO TURN IN NASHVILLE" page header. */
export function Header() {
    return (
        <header className="mt-[7px] flex h-[45px] w-full flex-row items-center justify-start pb-[10px]">
            <img src={logo} alt="Where To Turn In Nashville logo" className="ml-[11px] mr-[10px] h-[42px] w-[42px] object-contain" />
            <div>
                <p className="font-lexend-semibold text-[18px] leading-snug">WHERE TO TURN</p>
                <p className="font-lexend-semibold text-[18px] leading-snug">IN NASHVILLE</p>
            </div>
        </header>
    );
}
