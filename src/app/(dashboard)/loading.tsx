import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="flex h-full w-full items-center justify-center min-h-[50vh]">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-10 w-10 animate-spin text-purple-600" />
        <p className="text-sm text-zinc-500 animate-pulse">Loading dashboard...</p>
      </div>
    </div>
  );
}