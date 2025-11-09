import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface LeaguesHeaderProps {
  orgId: string;
}

export function LeaguesHeader({ orgId }: LeaguesHeaderProps) {
  const router = useRouter();

  return (
    <>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm mb-8">
        <button
          onClick={() => router.push(`/${orgId}`)}
          className="text-brand-dark hover:text-brand-dark/80 font-medium flex items-center gap-1"
        >
          <ChevronLeft size={16} />
          Back to Organization
        </button>
      </div>

      {/* Page Title */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-brand-dark mb-2">Leagues</h1>
        <p className="text-neutral-600">
          Manage your organization's leagues and templates
        </p>
      </div>
    </>
  );
}
