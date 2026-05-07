import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import {
  deleteWorkout as deleteWorkoutApi,
  getWorkouts,
  saveWorkout as saveWorkoutApi,
  updateWorkout as updateWorkoutApi,
} from "../api/workouts";

const workoutsKey = (email) => ["workouts", email];

const getEmail = () => localStorage.getItem("email");

export const useWorkouts = () => {
  const email = getEmail();
  const query = useQuery({
    queryKey: workoutsKey(email),
    queryFn: async () => {
      try {
        return await getWorkouts(email);
      } catch (error) {
        console.error("[workouts] fetch failed", {
          status: error?.response?.status,
          data: error?.response?.data,
          message: error?.message,
          url: error?.config?.url,
        });
        throw error;
      }
    },
    enabled: !!email,
  });
  return query;
};

export const useSaveWorkout = () => {
  const queryClient = useQueryClient();
  const email = getEmail();
  return useMutation({
    mutationFn: saveWorkoutApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workoutsKey(email) });
      toast.success("Workout saved successfully!");
    },
    onError: (error) => {
      console.error("Error saving workout:", error.response || error);
      toast.error("Failed to save workout. Please try again.");
    },
  });
};

export const useUpdateWorkout = () => {
  const queryClient = useQueryClient();
  const email = getEmail();
  return useMutation({
    mutationFn: updateWorkoutApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workoutsKey(email) });
      toast.success("Workout updated successfully!");
    },
    onError: (error) => {
      console.error("Error updating workout:", error.response || error);
      toast.error("Failed to update workout. Please try again.");
    },
  });
};

export const useDeleteWorkout = () => {
  const queryClient = useQueryClient();
  const email = getEmail();
  const key = workoutsKey(email);

  return useMutation({
    mutationFn: deleteWorkoutApi,
    onMutate: async ({ workoutID }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData(key);
      queryClient.setQueryData(key, (old) =>
        Array.isArray(old) ? old.filter((w) => w.workoutID !== workoutID) : old
      );
      return { previous };
    },
    onError: (error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
      console.error("Error deleting workout:", error.response || error);
      toast.error("Failed to delete workout. Please try again.");
    },
    onSuccess: () => {
      toast.success("Workout deleted successfully.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key });
    },
  });
};
