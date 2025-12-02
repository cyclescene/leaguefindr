import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { FieldError } from "react-hook-form";

interface SportFormInputProps {
  value: string;
  onChange: (value: string) => void;
  onFocus: () => void;
  onBlur?: () => void;
  onClear: () => void;
  isSelected: boolean;
  loading: boolean;
  error?: FieldError;
  showAutocomplete: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  filteredSuggestions: any[];
  children: React.ReactNode; // Autocomplete dropdown
}

export function SportFormInput({
  value,
  onChange,
  onFocus,
  onBlur,
  onClear,
  isSelected,
  loading,
  error,
  showAutocomplete,
  filteredSuggestions,
  children,
}: SportFormInputProps) {
  return (
    <div className="space-y-2">
      <div className="relative">
        <div className="relative">
          <Input
            id="sport-name"
            placeholder="e.g., Basketball, Football, Tennis"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={onFocus}
            onBlur={onBlur}
            disabled={loading}
            maxLength={255}
            autoComplete="off"
          />
          {isSelected && (
            <button
              type="button"
              onClick={onClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Autocomplete dropdown */}
        {showAutocomplete && filteredSuggestions.length > 0 && children}
      </div>

      {error && <p className="text-red-700 text-sm">{error.message}</p>}

      <p className="text-xs text-gray-500">{value.length}/255 characters</p>
    </div>
  );
}
