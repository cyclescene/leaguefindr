import { ChevronRight, Edit2, Trash2, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface OrganizationHeaderProps {
  orgId: string;
  orgName: string;
  onEditClick: () => void;
  onDeleteClick: () => void;
  onInviteClick: () => void;
}

export function OrganizationHeader({
  orgId,
  orgName,
  onEditClick,
  onDeleteClick,
  onInviteClick,
}: OrganizationHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex items-center justify-between gap-4 text-sm mb-6">
      <div className="flex items-center gap-2">
        <button
          onClick={() => router.push("/")}
          className="text-brand-dark hover:text-brand-dark/80 font-medium"
        >
          Organizations
        </button>
        <ChevronRight size={16} className="text-neutral-400" />
        <span className="text-neutral-600">{orgName}</span>
      </div>
      <div className="flex gap-2">
        <Button
          onClick={onInviteClick}
          variant="brandDark"
          size="sm"
        >
          <Share2 size={16} className="mr-2" />
          Invite Members
        </Button>
        <Button
          onClick={onEditClick}
          variant="outline"
          size="sm"
          className="border-brand-dark text-brand-dark hover:bg-brand-light"
        >
          <Edit2 size={16} className="mr-2" />
          Edit
        </Button>
        <Button
          onClick={onDeleteClick}
          variant="outline"
          size="sm"
          className="border-red-300 text-red-600 hover:bg-red-50"
        >
          <Trash2 size={16} className="mr-2" />
          Delete
        </Button>
      </div>
    </div>
  );
}
