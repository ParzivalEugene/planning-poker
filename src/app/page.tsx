import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";

export default async function Home() {
  // Array of poker planning card values
  const cardValues = ["0", "1", "2", "3", "5", "8", "13", "20", "40", "100"];

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header/Nav Bar */}
      <header className="bg-card/50 w-full border-b backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="bg-primary flex h-8 w-8 items-center justify-center rounded-md">
              <span className="text-primary-foreground font-bold">PP</span>
            </div>
            <span className="font-semibold">Poker Planning</span>
          </div>

          {/* Room Info & Copy Button */}
          <div className="flex items-center gap-4">
            {/* Users in the room */}
            <div className="flex -space-x-2">
              <div className="border-background flex h-8 w-8 items-center justify-center rounded-full border-2 bg-blue-500 text-xs font-medium text-white">
                JD
              </div>
              <div className="border-background flex h-8 w-8 items-center justify-center rounded-full border-2 bg-green-500 text-xs font-medium text-white">
                AM
              </div>
              <div className="border-background flex h-8 w-8 items-center justify-center rounded-full border-2 bg-yellow-500 text-xs font-medium text-white">
                RK
              </div>
              <div className="bg-background border-background text-muted-foreground flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-medium">
                +2
              </div>
            </div>
            <Button>
              <Copy size={16} />
              Copy Room link
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="grid grid-cols-5 grid-rows-4 gap-8">
          <div className="bg-card z-10 col-span-3 col-start-2 row-span-2 row-start-2 flex h-64 w-96 items-center justify-center rounded-xl border shadow-lg">
            <h2 className="text-card-foreground text-2xl font-bold">
              Planning Area
            </h2>
          </div>

          <PlanningCard
            value={cardValues[0]}
            className="col-start-2 row-start-1"
          />
          <PlanningCard
            value={cardValues[1]}
            className="col-start-3 row-start-1"
          />
          <PlanningCard
            value={cardValues[2]}
            className="col-start-4 row-start-1"
          />

          <PlanningCard
            value={cardValues[3]}
            className="col-start-1 row-start-2"
          />
          <PlanningCard
            value={cardValues[4]}
            className="col-start-1 row-start-3"
          />

          <PlanningCard
            value={cardValues[5]}
            className="col-start-5 row-start-2"
          />
          <PlanningCard
            value={cardValues[6]}
            className="col-start-5 row-start-3"
          />

          <PlanningCard
            value={cardValues[7]}
            className="col-start-2 row-start-4"
          />
          <PlanningCard
            value={cardValues[8]}
            className="col-start-3 row-start-4"
          />
          <PlanningCard
            value={cardValues[9]}
            className="col-start-4 row-start-4"
          />
        </div>
      </div>

      {/* Footer with available cards */}
      <footer className="bg-background border-t px-6 py-4">
        <div className="container mx-auto">
          <div className="flex flex-col gap-2">
            <p className="text-muted-foreground mb-2 text-sm">
              Available Cards:
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {cardValues.map((value) => (
                <button key={value} className="group relative">
                  <Card className="group-hover:border-primary flex h-16 w-12 items-center justify-center transition-all hover:shadow-md">
                    <CardContent className="flex h-full items-center justify-center p-0">
                      <span className="font-bold">{value}</span>
                    </CardContent>
                  </Card>
                </button>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function PlanningCard({
  value,
  className,
}: {
  value: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <Card className="flex h-full w-full items-center justify-center transition-transform">
        <CardContent className="flex h-full items-center justify-center p-0">
          <span className="text-3xl font-bold">{value}</span>
        </CardContent>
      </Card>
    </div>
  );
}
