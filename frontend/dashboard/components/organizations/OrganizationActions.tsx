import { useRouter } from "next/navigation";

interface OrganizationActionsProps {
  orgId: string;
}

export function OrganizationActions({ orgId }: OrganizationActionsProps) {
  const router = useRouter();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
      <div className="bg-white rounded-lg p-6 border border-neutral-200">
        <h2 className="text-lg font-semibold text-brand-dark mb-4">Leagues</h2>
        <p className="text-neutral-600 mb-4">Manage and create leagues for your organization</p>
        <button
          onClick={() => router.push(`/${orgId}/leagues`)}
          className="text-brand-dark hover:text-brand-dark/80 font-semibold"
        >
          View Leagues →
        </button>
      </div>
    </div>
  );
}
