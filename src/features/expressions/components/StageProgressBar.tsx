interface Props {
  stage: number;
  skips?: number;
  onClick: (e: React.MouseEvent) => void;
}

function dotColor(i: number, stage: number, skips: number): string {
  if (i < stage) return "bg-teal-500 dark:bg-teal-400";
  if (i === stage && skips >= 3) return "bg-red-500 dark:bg-red-400";
  if (i === stage && skips >= 2) return "bg-amber-400 dark:bg-amber-400";
  return "bg-gray-200 dark:bg-slate-600";
}

export default function StageProgressBar({ stage, skips = 0, onClick }: Props) {
  return (
    <button onClick={onClick} className="flex items-center gap-0.5 shrink-0 self-stretch " title={`Stage ${stage}/9`}>
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className={`h-2 w-2 rounded-sm ${dotColor(i, stage, skips)}`} />
      ))}
    </button>
  );
}
