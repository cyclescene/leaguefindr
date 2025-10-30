import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SportFormActionsProps {
  loading: boolean;
  sportName: string;
  isRejectedSport: boolean;
  onClose: () => void;
}

export function SportFormActions({
  loading,
  sportName,
  isRejectedSport,
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

      {isRejectedSport ? (
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
