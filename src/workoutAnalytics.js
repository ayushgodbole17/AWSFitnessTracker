import React, { useEffect, useState } from "react";
import axios from "axios";
import "./WorkoutAnalytics.css";

// A utility function to convert the AI's Markdown-ish text into HTML
const formatAIText = (text) => {
  let formatted = text;

  // ### Some Heading → <h3>Some Heading</h3>
  formatted = formatted.replace(/^### (.*)$/gm, "<h3>$1</h3>");

  // **bold** → <strong>bold</strong>
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

  // - item → <li>item</li>
  formatted = formatted.replace(/^- (.*)$/gm, "<li>$1</li>");

  // Group consecutive <li>…</li> lines into a <ul> block
  formatted = formatted.replace(/(<li>.*?<\/li>)+/gs, (match) => {
    return `<ul>${match}</ul>`;
  });

  return formatted;
};


const WorkoutAnalytics = ({ workouts }) => {
  const [analytics, setAnalytics] = useState({
    muscleGroupAnalytics: {},
    workoutFrequency: "",
  });
  const [expandedExercises, setExpandedExercises] = useState({});
  const [aiInsights, setAiInsights] = useState(""); // Holds the AI response
  const [loadingAI, setLoadingAI] = useState(false); // For showing a "Loading..." state if needed

  useEffect(() => {
    if (workouts.length > 0) {
      analyzeWorkouts();
    }
  }, [workouts]);

  // -------------------------------------------------------------------
  // 1) Standard local analytics (volume data, muscle group analysis, etc.)
  // -------------------------------------------------------------------
  const analyzeWorkouts = () => {
    let avgVolumeData = {}; // Aggregated data for average volume per set
    let maxWeightData = {};
  
    const pullChinExercises = [
      "Pull Ups",
      "Assisted Pull Ups",
      "Chin Ups",
      "Assisted Chin-Ups",
    ];
  
    // Sort workouts chronologically
    const sortedWorkouts = [...workouts].sort(
      (a, b) => new Date(a.workoutDate) - new Date(b.workoutDate)
    );
  
    sortedWorkouts.forEach((workout) => {
      const aggregatedData = {}; // key: { totalVolume, totalSets }
      const maxWeightByExercise = {};
  
      workout.exercises.forEach((exercise) => {
        let key = `${exercise.muscleGroup}-${exercise.exercise}`;
  
        // Group similar exercises for back (e.g., pull ups and chin ups)
        if (
          exercise.muscleGroup === "Back" &&
          pullChinExercises.includes(exercise.exercise)
        ) {
          key = "Back-Pull Up + Chin-Up";
        }
  
        // Compute overall volume for the exercise entry
        const volume = exercise.sets * exercise.reps * Math.abs(exercise.weight);
        const sets = exercise.sets;
  
        // Aggregate total volume and sets for average calculation
        if (!aggregatedData[key]) {
          aggregatedData[key] = { totalVolume: 0, totalSets: 0 };
        }
        aggregatedData[key].totalVolume += volume;
        aggregatedData[key].totalSets += sets;
  
        // Track max weight for each exercise
        if (!maxWeightByExercise[key]) {
          maxWeightByExercise[key] = exercise.weight;
        } else {
          maxWeightByExercise[key] = Math.max(
            maxWeightByExercise[key],
            exercise.weight
          );
        }
      });
  
      // Compute average volume per set for each exercise in this workout
      Object.keys(aggregatedData).forEach((key) => {
        const { totalVolume, totalSets } = aggregatedData[key];
        const avgVolume = totalSets > 0 ? totalVolume / totalSets : 0;
        if (!avgVolumeData[key]) {
          avgVolumeData[key] = [];
        }
        avgVolumeData[key].push({
          date: new Date(workout.workoutDate),
          volume: avgVolume,
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
    const uniqueDates = [
      ...new Set(sortedWorkouts.map((workout) => workout.workoutDate)),
    ];
    const workoutFrequency = `You worked out on ${totalWorkouts} days, covering ${uniqueDates.length} unique days.`;
  
    // Build muscle group analytics using average volume per set
    const muscleGroupAnalytics = {};
    Object.keys(avgVolumeData).forEach((exerciseKey) => {
      const [muscleGroup, exerciseName] = exerciseKey.split("-");
      const volumeEntries = avgVolumeData[exerciseKey];
      const weightEntries = maxWeightData[exerciseKey] || [];
      volumeEntries.sort((a, b) => a.date - b.date);
      weightEntries.sort((a, b) => a.date - b.date);
  
      if (!muscleGroupAnalytics[muscleGroup]) {
        muscleGroupAnalytics[muscleGroup] = { exercises: {} };
      }
  
      const uniqueWorkoutDays = new Set(
        volumeEntries.map((entry) => entry.date.toDateString())
      ).size;
  
      if (!muscleGroupAnalytics[muscleGroup].exercises[exerciseName]) {
        muscleGroupAnalytics[muscleGroup].exercises[exerciseName] = { metrics: [] };
      }
  
      // Only calculate changes if there are multiple data points
      if (volumeEntries.length > 1 && uniqueWorkoutDays > 1) {
        const initialAvg = volumeEntries[0].volume;
        const finalAvg = volumeEntries[volumeEntries.length - 1].volume;
        let avgIncrease = initialAvg === 0 ? finalAvg * 100 : ((finalAvg - initialAvg) / initialAvg) * 100;
  
        muscleGroupAnalytics[muscleGroup].exercises[exerciseName].metrics.push(
          `• Average volume per set increase since first workout: ${avgIncrease.toFixed(
            2
          )}% (${initialAvg.toFixed(2)} vs ${finalAvg.toFixed(2)})`
        );
  
        if (uniqueWorkoutDays === 2) {
          muscleGroupAnalytics[muscleGroup].exercises[exerciseName].metrics.push(
            `• Average volume per set increase over all workouts: ${avgIncrease.toFixed(
              2
            )}% (calculated over ${uniqueWorkoutDays} unique workout days)`
          );
          muscleGroupAnalytics[muscleGroup].exercises[exerciseName].metrics.push(
            `• Average volume per set increase since last workout: ${avgIncrease.toFixed(
              2
            )}% (${initialAvg.toFixed(2)} vs ${finalAvg.toFixed(2)})`
          );
        } else {
          // Calculate the average percentage change between consecutive workouts
          let totalPercentageIncrease = 0;
          let count = 0;
          for (let i = 1; i < volumeEntries.length; i++) {
            const prevAvg = volumeEntries[i - 1].volume;
            const currAvg = volumeEntries[i].volume;
            let percentageChange = prevAvg === 0 ? currAvg * 100 : ((currAvg - prevAvg) / prevAvg) * 100;
            totalPercentageIncrease += percentageChange;
            count++;
          }
          const averagePercentageIncrease = count > 0 ? totalPercentageIncrease / count : 0;
          muscleGroupAnalytics[muscleGroup].exercises[exerciseName].metrics.push(
            `• Average volume per set increase over all workouts: ${averagePercentageIncrease.toFixed(
              2
            )}% (calculated over ${uniqueWorkoutDays} unique workout days)`
          );
  
          const previousAvg = volumeEntries[volumeEntries.length - 2].volume;
          const recentAvg = volumeEntries[volumeEntries.length - 1].volume;
          let recentIncrease = previousAvg === 0 ? recentAvg * 100 : ((recentAvg - previousAvg) / previousAvg) * 100;
          muscleGroupAnalytics[muscleGroup].exercises[exerciseName].metrics.push(
            `• Average volume per set change since last workout: ${recentIncrease.toFixed(
              2
            )}% (${previousAvg.toFixed(2)} vs ${recentAvg.toFixed(2)})`
          );
        }
      } else {
        muscleGroupAnalytics[muscleGroup].exercises[exerciseName].metrics.push(
          `• Analytics for average volume per set of ${exerciseName} are unavailable due to insufficient data.`
        );
      }
  
      // Max Weight Analysis (unchanged)
      if (weightEntries.length > 1) {
        const initialWeight = weightEntries[0].weight;
        const recentWeight = weightEntries[weightEntries.length - 1].weight;
        muscleGroupAnalytics[muscleGroup].exercises[exerciseName].metrics.push(
          `• Max weight lifted increased from ${getWeightLabel(initialWeight)} to ${getWeightLabel(recentWeight)} since the first workout.`
        );
        if (weightEntries.length > 1) {
          const previousWeight = weightEntries[weightEntries.length - 2].weight;
          muscleGroupAnalytics[muscleGroup].exercises[exerciseName].metrics.push(
            `• Change in max weight from the previous workout to the most recent: ${getWeightLabel(previousWeight)} -> ${getWeightLabel(recentWeight)}.`
          );
        }
        const allTimeMax = Math.max(...weightEntries.map((entry) => entry.weight));
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

  const toggleExerciseDetails = (muscleGroup, exerciseName) => {
    setExpandedExercises((prev) => ({
      ...prev,
      [`${muscleGroup}-${exerciseName}`]:
        !prev[`${muscleGroup}-${exerciseName}`],
    }));
  };

  // -------------------------------------------------------------------
  // 2) AI Analysis Button
  // -------------------------------------------------------------------
  // Minimal transform function, similar to what's used in Chatbot
  const transformWorkouts = (rawWorkouts) => {
    return rawWorkouts.map((workout) => ({
      workoutName: workout.workoutName,
      workoutDate: workout.workoutDate,
      exercises: (workout.exercises || []).map((ex) => ({
        exercise: ex.exercise,
        sets: ex.sets,
        reps: ex.reps,
        weight: ex.weight,
        isAssistance: ex.isAssistance,
      })),
    }));
  };

  const handleAIAnalysis = async () => {
    if (!workouts || workouts.length === 0) return;
    setLoadingAI(true);
    setAiInsights("Analyzing your workouts with AI...");

    try {
      const minimalWorkouts = transformWorkouts(workouts);

      // Make your existing chatbot-style API call:
      // (Same environment variable or direct URL used by Chatbot)
      const response = await axios.post(
        process.env.REACT_APP_CHATBOT_API_URL,
        {
          userInput: "Analyze my workouts",  // or "analyse my workouts" etc.
          workoutHistory: minimalWorkouts,
        },
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      // Use the AI response
      const aiResponse = response.data?.response || "No insights available.";
      setAiInsights(aiResponse);
    } catch (error) {
      console.error("Error with AI Analysis:", error);
      setAiInsights(
        "An error occurred while analyzing. Please try again later."
      );
    } finally {
      setLoadingAI(false);
    }
  };

  return (
    <div>
      <div className="analytics-title-container">
        <h3 className="analytics-title">Workout Analytics</h3>
      </div>

      <div className="analytics-container">
        {/* 2A) Display Local Analytics Frequency */}
        {analytics.workoutFrequency && (
          <p className="workout-frequency">{analytics.workoutFrequency}</p>
        )}

        {/* 2B) Button to trigger AI analysis + AI response display */}
        <div className="ai-analysis-section">
          <button
            className="ai-analyze-btn"
            onClick={handleAIAnalysis}
            disabled={loadingAI}
          >
            Analyze with AI
          </button>
          {aiInsights && (
            <div className="ai-insights">
              {loadingAI ? (
                <span>{aiInsights}</span>
              ) : (
                <div
                  dangerouslySetInnerHTML={{ __html: formatAIText(aiInsights) }}
                />
              )}
            </div>
          )}

        </div>

        {/* 2C) Muscle Group-Specific Data */}
        {Object.keys(analytics.muscleGroupAnalytics).map((muscleGroup) => (
          <div key={muscleGroup} className="muscle-group-section">
            <h4>{muscleGroup}</h4>
            <div className="exercise-grid">
              {Object.keys(analytics.muscleGroupAnalytics[muscleGroup].exercises).map(
                (exerciseName) => (
                  <div
                    key={exerciseName}
                    className="exercise-card"
                    onClick={() =>
                      toggleExerciseDetails(muscleGroup, exerciseName)
                    }
                  >
                    <h5>{exerciseName}</h5>
                    {expandedExercises[`${muscleGroup}-${exerciseName}`] && (
                      <div className="exercise-details show">
                        <ul>
                          {analytics.muscleGroupAnalytics[muscleGroup].exercises[
                            exerciseName
                          ].metrics.map((item, index) => (
                            <li key={index}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WorkoutAnalytics;
