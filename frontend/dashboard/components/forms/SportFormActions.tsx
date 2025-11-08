import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SportFormActionsProps {
  loading: boolean;
  sportName: string;
  isRejectedSport: boolean | undefined;
  isApprovedSport: boolean | undefined;
  onClose: () => void;
}

export function SportFormActions({
  loading,
  sportName,
  isRejectedSport,
  isApprovedSport,
  onClose,
}: SportFormActionsProps) {
  return (
    <div className="flex gap-2 justify-end pt-4">
      <Button
        type="button"
        variant="outline"
        onClick={onClose}
        disabled={loading}
      >
        Cancel
      </Button>

      {isApprovedSport ? (
        <Button type="submit" variant="outline" disabled={true}>
          Sport Already Available
        </Button>
      ) : isRejectedSport ? (
        <Button type="submit" variant="brandDark" disabled={loading || !sportName.trim()}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Requesting...
            </>
          ) : (
            "Request Anyway"
          )}
        </Button>
      ) : (
        <Button type="submit" variant="brandDark" disabled={loading || !sportName.trim()}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Adding Sport...
            </>
          ) : (
            "Add Sport"
          )}
        </Button>
      )}
    </div>
  );
}
