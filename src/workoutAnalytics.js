import React, { useEffect, useState } from "react";
import "./WorkoutAnalytics.css";

const WorkoutAnalytics = ({ workouts }) => {
  const [analytics, setAnalytics] = useState({
    muscleGroupAnalytics: {},
    workoutFrequency: "",
  });
  const [expandedExercises, setExpandedExercises] = useState({});

  useEffect(() => {
    if (workouts.length > 0) {
      analyzeWorkouts();
    }
  }, [workouts]);

  const analyzeWorkouts = () => {
    let volumeData = {};
    let maxWeightData = {};
    let muscleGroupWorkouts = {};

    const pullChinExercises = [
      "Pull Ups",
      "Assisted Pull Ups",
      "Chin Ups",
      "Assisted Chin-Ups",
    ];

    // Sort workouts by date to ensure calculations are done in correct order
    const sortedWorkouts = workouts.sort(
      (a, b) => new Date(a.workoutDate) - new Date(b.workoutDate)
    );

    sortedWorkouts.forEach((workout) => {
      const aggregatedVolume = {};
      const maxWeightByExercise = {};

      // Aggregate volume and find max weight for each exercise in a workout day
      workout.exercises.forEach((exercise) => {
        let key = `${exercise.muscleGroup}-${exercise.exercise}`;
        const muscleGroup = exercise.muscleGroup;

        // Handle grouping of Pull-Up and Chin-Up exercises
        if (exercise.muscleGroup === "Back" && pullChinExercises.includes(exercise.exercise)) {
          key = "Back-Pull Up + Chin-Up";
        }

        // Calculate the volume for the current instance of the exercise
        const volume = exercise.sets * exercise.reps * Math.abs(exercise.weight);

        // Aggregate volume data for the day
        if (!aggregatedVolume[key]) {
          aggregatedVolume[key] = 0;
        }
        aggregatedVolume[key] += volume;

        // Track the max weight lifted for each exercise
        if (!maxWeightByExercise[key]) {
          maxWeightByExercise[key] = exercise.weight;
        } else {
          maxWeightByExercise[key] = Math.max(maxWeightByExercise[key], exercise.weight);
        }
      });

      // Store the aggregated volume and max weight data
      Object.keys(aggregatedVolume).forEach((key) => {
        if (!volumeData[key]) {
          volumeData[key] = [];
        }
        volumeData[key].push({
          date: new Date(workout.workoutDate),
          volume: aggregatedVolume[key],
        });

        if (maxWeightByExercise[key] !== undefined) {
          if (!maxWeightData[key]) {
            maxWeightData[key] = [];
          }
          maxWeightData[key].push({
            date: new Date(workout.workoutDate),
            weight: maxWeightByExercise[key],
          });
        }
      });
    });

    // Calculate workout frequency
    const totalWorkouts = sortedWorkouts.length;
    const uniqueDates = [...new Set(sortedWorkouts.map((workout) => workout.workoutDate))];
    const workoutFrequency = `You worked out on ${totalWorkouts} days, covering ${uniqueDates.length} unique days.`;

    // Calculate volume increase, max weight increase, and other metrics
    const muscleGroupAnalytics = {};
    Object.keys(volumeData).forEach((exerciseKey) => {
      const [muscleGroup, exerciseName] = exerciseKey.split("-");
      const volumeEntries = volumeData[exerciseKey];
      const weightEntries = maxWeightData[exerciseKey];
      volumeEntries.sort((a, b) => a.date - b.date);
      if (weightEntries) {
        weightEntries.sort((a, b) => a.date - b.date);
      }

      if (!muscleGroupAnalytics[muscleGroup]) {
        muscleGroupAnalytics[muscleGroup] = {
          exercises: {},
        };
      }

      const uniqueWorkoutDays = new Set(volumeEntries.map((entry) => entry.date.toDateString())).size;

      // Initialize analytics for the exercise
      if (!muscleGroupAnalytics[muscleGroup].exercises[exerciseName]) {
        muscleGroupAnalytics[muscleGroup].exercises[exerciseName] = {
          metrics: [],
        };
      }

      // Volume Increase Analysis for Each Exercise
      if (volumeEntries.length > 1 && uniqueWorkoutDays > 1) {
        // Calculate Percentage Increase from First Workout to Most Recent Workout
        const initialVolume = volumeEntries[0].volume;
        const finalVolume = volumeEntries[volumeEntries.length - 1].volume;
        let volumeIncrease;

        if (initialVolume < 0) {
          volumeIncrease = ((Math.abs(initialVolume) - Math.abs(finalVolume)) / Math.abs(initialVolume)) * 100;
        } else {
          volumeIncrease = ((finalVolume - initialVolume) / initialVolume) * 100;
        }

        muscleGroupAnalytics[muscleGroup].exercises[exerciseName].metrics.push(
          `• Volume increase since first workout: ${volumeIncrease.toFixed(2)}% (${initialVolume} vs ${finalVolume})`
        );

        if (uniqueWorkoutDays === 2) {
          // If only two unique workout days, the average increase and recent increase are the same as overall increase
          muscleGroupAnalytics[muscleGroup].exercises[exerciseName].metrics.push(
            `• Average volume increase over all workouts: ${volumeIncrease.toFixed(2)}% (calculated over ${uniqueWorkoutDays} unique workout days)`
          );
          muscleGroupAnalytics[muscleGroup].exercises[exerciseName].metrics.push(
            `• Volume increase since last workout: ${volumeIncrease.toFixed(2)}% (${initialVolume} vs ${finalVolume})`
          );
        } else {
          // Average Percentage Increase Between Consecutive Workouts
          let totalPercentageIncrease = 0;
          let count = 0;
          for (let i = 1; i < volumeEntries.length; i++) {
            const previousVolume = volumeEntries[i - 1].volume;
            const currentVolume = volumeEntries[i].volume;
            let percentageChange;

            if (previousVolume < 0) {
              percentageChange = ((Math.abs(previousVolume) - Math.abs(currentVolume)) / Math.abs(previousVolume)) * 100;
            } else {
              percentageChange = ((currentVolume - previousVolume) / previousVolume) * 100;
            }

            totalPercentageIncrease += percentageChange;
            count++;
          }
          const averageVolumeIncrease = count > 0 ? totalPercentageIncrease / count : 0;
          muscleGroupAnalytics[muscleGroup].exercises[exerciseName].metrics.push(
            `• Average volume increase over all workouts: ${averageVolumeIncrease.toFixed(2)}% (calculated over ${uniqueWorkoutDays} unique workout days)`
          );

          // Percentage Increase from Previous Workout to Most Recent Workout
          const previousVolume = volumeEntries[volumeEntries.length - 2].volume;
          const recentVolume = volumeEntries[volumeEntries.length - 1].volume;
          let recentIncrease;

          if (previousVolume < 0) {
            recentIncrease = ((Math.abs(previousVolume) - Math.abs(recentVolume)) / Math.abs(previousVolume)) * 100;
          } else {
            recentIncrease = ((recentVolume - previousVolume) / previousVolume) * 100;
          }

          muscleGroupAnalytics[muscleGroup].exercises[exerciseName].metrics.push(
            `• Volume increase since last workout: ${recentIncrease.toFixed(2)}% (${previousVolume} vs ${recentVolume})`
          );
        }
      } else {
        muscleGroupAnalytics[muscleGroup].exercises[exerciseName].metrics.push(
          `• Analytics for volume of ${exerciseName} are unavailable due to insufficient data.`
        );
      }

      // Max Weight Increase Analysis
      if (weightEntries && weightEntries.length > 1) {
        const initialWeight = weightEntries[0].weight;
        const recentWeight = weightEntries[weightEntries.length - 1].weight;

        // Max Weight Increase Since First Workout
        muscleGroupAnalytics[muscleGroup].exercises[exerciseName].metrics.push(
          `• Max weight lifted increased from ${getWeightLabel(initialWeight)} to ${getWeightLabel(recentWeight)} since the first workout.`
        );

        // Max Weight Increase Since Last Workout
        if (weightEntries.length > 1) {
          const previousWeight = weightEntries[weightEntries.length - 2].weight;
          muscleGroupAnalytics[muscleGroup].exercises[exerciseName].metrics.push(
            `• Change in max weight from the previous workout to the most recent workout: ${getWeightLabel(previousWeight)} to ${getWeightLabel(recentWeight)}.`
          );
        }

        // All-Time Max Weight
        const allTimeMax = Math.max(...weightEntries.map(entry => entry.weight));
        muscleGroupAnalytics[muscleGroup].exercises[exerciseName].metrics.push(
          `• All-time max weight lifted is ${getWeightLabel(allTimeMax)}.`
        );
      }
    });

    setAnalytics({
      muscleGroupAnalytics,
      workoutFrequency,
    });
  };

  const getWeightLabel = (weight) => {
    if (weight < 0) {
      return `${Math.abs(weight)} kg (assisted)`;
    } else {
      return `${weight} kg`;
    }
  };

  // Toggle the expanded state for a given exercise by muscle group and exercise name
  const toggleExerciseDetails = (muscleGroup, exerciseName) => {
    setExpandedExercises((prev) => ({
      ...prev,
      [`${muscleGroup}-${exerciseName}`]: !prev[`${muscleGroup}-${exerciseName}`],
    }));
  };

  return (
    <div>
      <div className="analytics-title-container">
        <h3 className="analytics-title">Workout Analytics</h3>
      </div>
      <div className="analytics-container">
      <p>
        <strong>Workout Frequency:</strong> {analytics.workoutFrequency}
      </p>
      {Object.keys(analytics.muscleGroupAnalytics).map((muscleGroup) => (
        <div key={muscleGroup} className="muscle-group-section">
          <h4>{muscleGroup}</h4>
          <div className="exercise-grid">
            {Object.keys(analytics.muscleGroupAnalytics[muscleGroup].exercises).map((exerciseName) => (
              <div key={exerciseName} className="exercise-card" onClick={() => toggleExerciseDetails(muscleGroup, exerciseName)}>
                <h5>{exerciseName}</h5>
                {expandedExercises[`${muscleGroup}-${exerciseName}`] && (
                  <div className="exercise-details show">
                    <ul>
                      {analytics.muscleGroupAnalytics[muscleGroup].exercises[exerciseName].metrics.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
    </div>
  );
};

export default WorkoutAnalytics;
