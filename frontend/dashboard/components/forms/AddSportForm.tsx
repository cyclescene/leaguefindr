"use client"

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@clerk/nextjs";
import { Label } from "@/components/ui/label";
import { addSportSchema, type AddSportFormData } from "@/lib/schemas";
import { useSportSearch } from "@/hooks/useSportSearch";
import { useAutocompleteLogic } from "@/hooks/useAutocompleteLogic";
import { SportAutocompleteDropdown } from "./SportAutocompleteDropdown";
import { SportStatusFeedback } from "./SportStatusFeedback";
import { SportFormInput } from "./SportFormInput";
import { SportFormActions } from "./SportFormActions";

interface Sport {
  id: number;
  name: string;
  status: "approved" | "pending" | "rejected";
  request_count: number;
}

interface AddSportFormProps {
  onSuccess?: () => void;
  onClose?: () => void;
}

export function AddSportForm({ onSuccess, onClose }: AddSportFormProps) {
  const { getToken, userId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [debouncedSportName, setDebouncedSportName] = useState("");
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [selectedSport, setSelectedSport] = useState<Sport | null>(null);

  const {
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    clearErrors,
  } = useForm<AddSportFormData>({
    resolver: zodResolver(addSportSchema),
    defaultValues: { name: "" },
  });

  const sportName = watch("name");

  // Debounce the sport name input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSportName(sportName);
      setShowAutocomplete(sportName.length >= 2);
    }, 300);

    return () => clearTimeout(timer);
  }, [sportName]);

  // Custom hooks
  const { approvedSports } = useSportSearch();
  const { autocompleteRef } = useAutocompleteLogic(
    showAutocomplete,
    setShowAutocomplete
  );

  // Check if sport exists in approved sports (case-insensitive)
  const sportExists = approvedSports.some(
    (sport) => sport.name.toLowerCase() === debouncedSportName.toLowerCase()
  );

  // Filter approved sports for autocomplete
  // Don't show suggestions if there's an exact match with selected sport
  const hasExactMatch = selectedSport && selectedSport.name.toLowerCase() === debouncedSportName.toLowerCase();

  const filteredSuggestions = showAutocomplete && debouncedSportName && !hasExactMatch
    ? approvedSports.filter((sport) =>
      sport.name.toLowerCase().includes(debouncedSportName.toLowerCase())
    )
    : [];

  const handleSelectSuggestion = (sport: Sport) => {
    setValue("name", sport.name);
    setSelectedSport(sport);
    setShowAutocomplete(false);
    clearErrors("name");
  };

  const handleClearSelection = () => {
    setValue("name", "");
    setSelectedSport(null);
    setDebouncedSportName("");
    setShowAutocomplete(false);
  };

  const submitSport = async (name: string): Promise<void> => {
    try {
      const token = await getToken();

      if (!token || !userId) {
        console.error("Authentication required. Please sign in.");
        setLoading(false);
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/sports/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            "X-Clerk-User-ID": userId,
          },
          body: JSON.stringify({ name }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Sport submission error:", errorData);
        throw new Error(errorData.error || "Failed to create sport");
      }

      setSuccess(true);
      setLoading(false);
      setTimeout(() => {
        onSuccess?.();
        onClose?.();
      }, 1500);
    } catch (err) {
      console.error("Error submitting sport:", err);
      setLoading(false);
    }
  };

  const onSubmit = async (data: AddSportFormData) => {
    setLoading(true);
    await submitSport(data.name);
  };

  if (success) {
    return (
      <div className="px-6 py-4 text-center">
        <p className="text-green-600 font-medium">Sport added successfully!</p>
      </div>
    );
  }

  // Check if sport exists (either typed and found in list, or selected from dropdown)
  // When selected from dropdown, immediately mark as existing
  const isSportExists = !!selectedSport || sportExists;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 px-6 py-4">
      <div className="space-y-2">
        <Label htmlFor="sport-name">Sport Name</Label>
        <div className="relative" ref={autocompleteRef}>
          <SportFormInput
            value={sportName}
            onChange={(value) => setValue("name", value)}
            onFocus={() => sportName.length >= 2 && !selectedSport && setShowAutocomplete(true)}
            onBlur={() => setTimeout(() => setShowAutocomplete(false), 150)}
            onClear={handleClearSelection}
            isSelected={!!selectedSport}
            loading={loading}
            error={errors.name}
            showAutocomplete={showAutocomplete}
            filteredSuggestions={filteredSuggestions}
          >
            <SportAutocompleteDropdown
              show={showAutocomplete && filteredSuggestions.length > 0}
              suggestions={filteredSuggestions}
              onSelect={handleSelectSuggestion}
            />
          </SportFormInput>
        </div>

        <SportStatusFeedback
          debouncedSportName={debouncedSportName}
          isSelected={!!selectedSport}
          sportExists={sportExists}
          selectedSportStatus={selectedSport?.status}
        />
      </div>

      <SportFormActions
        loading={loading}
        sportName={sportName}
        isSportExists={isSportExists}
        onClose={onClose || (() => { })}
      />
    </form>
  );
}
