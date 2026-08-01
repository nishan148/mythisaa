import { Container } from "@/components/ui/container";

const brands = ["NORTHSTAR", "Aperture", "vertex", "MONOLITH", "Formless", "arc"];

export function Trusted() {
  return (
    <section className="border-y border-zinc-200 bg-white py-10" aria-label="Trusted by future builders">
      <Container>
        <p className="text-center text-[11px] font-semibold uppercase tracking-[.18em] text-zinc-400">Trusted by future builders at</p>
        <div className="mt-7 grid grid-cols-2 items-center gap-x-6 gap-y-6 sm:grid-cols-3 lg:grid-cols-6">
          {brands.map((brand, index) => <span key={brand} className={`text-center text-sm font-semibold tracking-tight text-zinc-400 ${index % 2 ? "font-mono text-xs" : ""}`}>{brand}</span>)}
        </div>
      </Container>
    </section>
  );
}