"use client"

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { addSportSchema, type AddSportFormData } from "@/lib/schemas";

interface AddSportFormProps {
  onSuccess?: () => void;
  onClose?: () => void;
}

export function AddSportForm({ onSuccess, onClose }: AddSportFormProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<AddSportFormData>({
    resolver: zodResolver(addSportSchema),
    defaultValues: {
      name: "",
    },
  });

  const sportName = watch("name");

  const checkSportExists = async (name: string): Promise<boolean> => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/sports/`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch sports");
      }

      const data = await response.json();
      const sports = data.sports || [];
      return sports.some(
        (sport: any) => sport.name.toLowerCase() === name.toLowerCase()
      );
    } catch (err) {
      console.error("Error checking sport exists:", err);
      throw err;
    }
  };

  const submitSport = async (name: string): Promise<void> => {
    try {
      const token = await getToken();

      if (!token) {
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
          },
          body: JSON.stringify({ name }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
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

  const getToken = async (): Promise<string | null> => {
    try {
      const response = await fetch("/api/auth/token");
      if (!response.ok) return null;
      const data = await response.json();
      return data.token;
    } catch (err) {
      console.error("Error getting token:", err);
      return null;
    }
  };

  const onSubmit = async (data: AddSportFormData) => {
    setLoading(true);

    try {
      // Check if sport already exists
      const exists = await checkSportExists(data.name);
      if (exists) {
        // Error handling would normally be done with react-hook-form's setError
        // For now, we'll submit which will let the API handle it
      }

      // Submit new sport
      await submitSport(data.name);
    } catch (err) {
      console.error("Error in form submission:", err);
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="py-4 text-center">
        <p className="text-green-600 font-medium">Sport added successfully!</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="sport-name">Sport Name</Label>
        <Input
          id="sport-name"
          placeholder="e.g., Basketball, Football, Tennis"
          {...register("name")}
          disabled={loading}
          maxLength={255}
        />
        {errors.name && (
          <p className="text-red-700 text-sm">{errors.name.message}</p>
        )}
        <p className="text-xs text-gray-500">
          {sportName.length}/255 characters
        </p>
      </div>

      <div className="flex gap-2 justify-end pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="brandDark"
          disabled={loading || !sportName.trim()}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Adding Sport...
            </>
          ) : (
            "Add Sport"
          )}
        </Button>
      </div>
    </form>
  );
}
