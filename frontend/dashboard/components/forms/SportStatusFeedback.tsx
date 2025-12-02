import { CheckCircle2, AlertCircle } from "lucide-react";

interface SportStatusFeedbackProps {
  debouncedSportName: string;
  isSelected: boolean;
  sportExists: boolean;
  selectedSportStatus?: "approved" | "pending" | "rejected";
}

export function SportStatusFeedback({
  debouncedSportName,
  isSelected,
  sportExists,
  selectedSportStatus,
}: SportStatusFeedbackProps) {
  const shouldShow = debouncedSportName && debouncedSportName.length >= 2;

  if (!shouldShow) {
    return <div className="mt-3 min-h-[80px]" />;
  }

  // If sport is selected from dropdown, it always exists
  // Otherwise check if the typed name matches an existing sport
  const sportExistsInDb = isSelected || sportExists;

  return (
    <div className="mt-3 min-h-[80px]">
      {sportExistsInDb ? (
        /* Sport already exists */
        <div className="space-y-2 bg-yellow-50 p-3 rounded-md border border-yellow-200">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-yellow-700 text-sm font-medium">This sport already exists</p>
            </div>
          </div>
        </div>
      ) : (
        /* Sport name is available */
        <div className="space-y-2 bg-green-50 p-3 rounded-md border border-green-200">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-green-700 text-sm font-medium">Sport name is available</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
