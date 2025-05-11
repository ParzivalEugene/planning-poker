import { Card, CardContent } from "@/components/ui/card";

type PlanningCardProps = {
  value: string;
  className?: string;
  onClick?: () => void;
};

export function PlanningCard({ value, className, onClick }: PlanningCardProps) {
  return (
    <div className={className} onClick={onClick}>
      <Card className="flex h-full w-full cursor-pointer items-center justify-center transition-transform hover:scale-105">
        <CardContent className="flex h-full items-center justify-center p-0">
          <span className="text-3xl font-bold">{value}</span>
        </CardContent>
      </Card>
    </div>
  );
}
