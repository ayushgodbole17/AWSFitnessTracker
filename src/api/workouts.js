import apiClient from "../apiClient";

export const getWorkouts = async (email) => {
  const { data } = await apiClient.get("/GetPastWorkouts", { params: { email } });
  return Array.isArray(data) ? data : [];
};

export const saveWorkout = async (payload) => {
  const { data } = await apiClient.post("/saveWorkout", payload);
  return data;
};

export const updateWorkout = async (payload) => {
  const { data } = await apiClient.post("/updateWorkout", payload);
  return data;
};

export const deleteWorkout = async ({ workoutID, userID }) => {
  const { data } = await apiClient.delete("/deleteWorkout", { params: { workoutID, userID } });
  return data;
};
