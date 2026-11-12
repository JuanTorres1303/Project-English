import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-[100dvh] place-items-center bg-ink-950 px-5 text-center">
      <div>
        <p className="text-sm font-semibold tracking-[0.18em] text-leaf-300">BOGOTÁ</p>
        <h1 className="mt-4 text-4xl font-semibold text-fog-50 md:text-5xl">This street is not on the map.</h1>
        <p className="mt-4 text-base text-fog-400">The page you are looking for does not exist.</p>
        <Link
          href="/"
          className="mt-8 inline-flex rounded-full bg-leaf-500 px-6 py-3 text-base font-semibold text-ink-950 transition duration-300 hover:bg-leaf-300"
        >
          Back to the city
        </Link>
      </div>
    </main>
  );
}
