"use client";

interface Props {
  models: string[];
  selected: string;
  onSelect: (model: string) => void;
  loading?: boolean;
}

export default function ModelSelector({
  models,
  selected,
  onSelect,
  loading,
}: Props) {
  if (loading) {
    return (
      <div className="h-9 w-48 rounded-lg shimmer border border-surface-700/40" />
    );
  }

  return (
    <select
      id="model-selector"
      value={selected}
      onChange={(e) => onSelect(e.target.value)}
      className="h-9 px-3 rounded-lg bg-surface-800 border border-surface-700/50 text-surface-200 text-xs font-medium focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/30 transition-all cursor-pointer appearance-none pr-8"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ea5bd' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 8px center",
      }}
    >
      {models.map((m) => (
        <option key={m} value={m}>
          {m}
        </option>
      ))}
    </select>
  );
}
