import Image from "next/image";
import Link from "next/link";
export default function Home() {
  return (
    <div>
      <h1>Home</h1>

      <div className = "flex flex-col items-center justify-center">
        <Link href="/generation"> generate room</Link>
      </div>
    </div>
  );
}
