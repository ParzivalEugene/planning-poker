import { Card, CardContent } from "@/components/ui/card";

type PlanningCardProps = {
  value: string;
  className?: string;
  onClick?: () => void;
};

export function PlanningCard({ value, className, onClick }: PlanningCardProps) {
  return (
    <div className={className} onClick={onClick}>
      <Card className="group relative flex h-full w-full cursor-pointer items-center justify-center overflow-hidden border-2 border-slate-200 bg-white/70 shadow-xl backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl dark:bg-slate-900/70">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
        <CardContent className="relative flex h-full items-center justify-center p-0">
          <span className="text-3xl font-bold text-slate-800 dark:text-slate-200">
            {value}
          </span>
        </CardContent>
      </Card>
    </div>
  );
}
