import { useEffect, useRef } from "react";

/**
 * Hook to manage autocomplete dropdown behavior
 * Handles closing dropdown when clicking outside
 */
export function useAutocompleteLogic(
  showAutocomplete: boolean,
  setShowAutocomplete: (show: boolean) => void
) {
  const autocompleteRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        autocompleteRef.current &&
        !autocompleteRef.current.contains(event.target as Node)
      ) {
        setShowAutocomplete(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setShowAutocomplete]);

  return { autocompleteRef };
}
