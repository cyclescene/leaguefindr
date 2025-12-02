import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SportFormActionsProps {
  loading: boolean;
  sportName: string;
  isSportExists: boolean | undefined;
  onClose: () => void;
}

export function SportFormActions({
  loading,
  sportName,
  isSportExists,
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

      {isSportExists ? (
        <Button type="submit" variant="outline" disabled={true}>
          Sport Already Exists
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
