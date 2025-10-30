interface Sport {
  id: number;
  name: string;
  status: "approved" | "pending" | "rejected";
  request_count: number;
}

interface SportAutocompleteDropdownProps {
  show: boolean;
  suggestions: Sport[];
  onSelect: (sport: Sport) => void;
}

export function SportAutocompleteDropdown({
  show,
  suggestions,
  onSelect,
}: SportAutocompleteDropdownProps) {
  if (!show || suggestions.length === 0) {
    return null;
  }

  return (
    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-10 max-h-48 overflow-y-auto">
      {suggestions.map((sport) => (
        <button
          key={sport.id}
          type="button"
          onClick={() => onSelect(sport)}
          className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors"
        >
          {sport.name}
        </button>
      ))}
    </div>
  );
}
