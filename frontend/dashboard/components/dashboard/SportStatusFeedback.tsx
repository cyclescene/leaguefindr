import { Loader2, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { CheckSportExistsResponse } from "@/hooks/useSportExistenceCheck";

interface SportStatusFeedbackProps {
  debouncedSportName: string;
  isSelected: boolean;
  isCheckingExistence: boolean;
  sportCheckData?: CheckSportExistsResponse;
  selectedSportStatus?: "approved" | "pending" | "rejected";
}

export function SportStatusFeedback({
  debouncedSportName,
  isSelected,
  isCheckingExistence,
  sportCheckData,
  selectedSportStatus,
}: SportStatusFeedbackProps) {
  const shouldShow = debouncedSportName && debouncedSportName.length >= 2;

  if (!shouldShow) {
    return <div className="mt-3 min-h-[80px]" />;
  }

  return (
    <div className="mt-3 min-h-[80px]">
      {/* Loading state */}
      {!isSelected && isCheckingExistence && (
        <div className="flex items-center gap-2 text-blue-600 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Checking availability...</span>
        </div>
      )}

      {/* Approved sport selected */}
      {isSelected && selectedSportStatus === "approved" && (
        <div className="flex items-center gap-2 text-green-600 text-sm">
          <CheckCircle2 className="h-4 w-4" />
          <span>Sport selected - ready to submit</span>
        </div>
      )}

      {/* Pending sport */}
      {!isSelected && sportCheckData?.exists && sportCheckData.status === "pending" && (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-orange-600 text-sm">
            <Clock className="h-4 w-4" />
            <span>Already requested by {sportCheckData.request_count || 1} user(s)</span>
          </div>
          <p className="text-xs text-orange-500 ml-6">
            This sport is awaiting admin approval
          </p>
        </div>
      )}

      {/* Rejected sport - show with demand and request option */}
      {!isSelected && sportCheckData?.exists && sportCheckData.status === "rejected" && (
        <div className="space-y-2 bg-red-50 p-3 rounded-md border border-red-200">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-red-700 text-sm font-medium">Sport was rejected</p>
              {sportCheckData.rejection_reason && (
                <p className="text-xs text-red-600 mt-1">
                  Reason: {sportCheckData.rejection_reason}
                </p>
              )}
              {sportCheckData.request_count && sportCheckData.request_count > 0 && (
                <p className="text-xs text-red-600 mt-1">
                  {sportCheckData.request_count} user(s) are requesting this
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sport not found in approved list */}
      {!isSelected &&
        !isCheckingExistence &&
        !sportCheckData?.exists && (
          <div className="flex items-center gap-2 text-green-600 text-sm">
            <CheckCircle2 className="h-4 w-4" />
            <span>Sport name available - submit to request</span>
          </div>
        )}
    </div>
  );
}
