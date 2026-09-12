const checkpoints = [
  ["Application shell", "READY"],
  ["Deterministic core", "PASS"],
  ["Domain validation", "PASS"],
  ["Scenario engine", "PASS"]
] as const;

export default function HomePage() {
  return (
    <main className="min-h-screen p-8">
      <section className="mx-auto max-w-2xl rounded-2xl border p-8">
        <p className="text-sm font-medium">Bitget AI Trading Desk</p>
        <h1 className="mt-2 text-2xl font-semibold">Development checkpoint</h1>
        <p className="mt-3 text-sm text-gray-600">
          Foundation only. Live Bitget, reference-market, evidence, and LLM integrations are intentionally not connected yet.
        </p>
        <div className="mt-8 space-y-3">
          {checkpoints.map(([label, status]) => (
            <div key={label} className="flex items-center justify-between rounded-lg border px-4 py-3 text-sm">
              <span>{label}</span>
              <span className="font-semibold">{status}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
