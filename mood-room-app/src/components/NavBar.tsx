import Link from "next/link";
import Image from "next/image"; // for logo

export default function NavBar() {
    return(
        <nav className="w-full bg-white border-b border-gray-200 relative h-16">
        {/* Centered nav links */}
        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <ul className="flex space-x-8 text-base font-medium text-gray-800">
                <li>
                    <Link href="/" className="transition-colors hover:text-[#7FD0BD]">Home</Link>
                </li>
                <li>
                    <Link href="/generation" className="transition-colors hover:text-[#7FD0BD]">Generate</Link>
                </li>
                <li>
                    <Link href="/socials" className="transition-colors hover:text-[#7FD0BD]">Socials</Link>
                </li>
            </ul>
        </div>

        {/* Right-aligned Login */}
        <div className="absolute right-6 top-1/2 transform -translate-y-1/2">
            <Link
                href="/login"
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-800 font-medium transition-colors hover:text-[#7FD0BD] hover:border-[#7FD0BD]"
            >
                Login
            </Link>
        </div>
    </nav>
    );
}
