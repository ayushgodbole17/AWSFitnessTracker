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
    let avgVolumeData = {}; // Stores average volume per set per exercise per workout
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
  
    // Process each workout to aggregate average volume per set and max weight per exercise
    sortedWorkouts.forEach((workout) => {
      const aggregatedData = {}; // key will map to { totalVolume, totalSets }
      const maxWeightByExercise = {};
  
      workout.exercises.forEach((exercise) => {
        let key = `${exercise.muscleGroup}-${exercise.exercise}`;
  
        // Group similar exercises (e.g., pull-ups and chin-ups under one key)
        if (
          exercise.muscleGroup === "Back" &&
          pullChinExercises.includes(exercise.exercise)
        ) {
          key = "Back-Pull Up + Chin-Up";
        }
  
        // Calculate overall volume for this exercise entry
        const totalVolume = exercise.sets * exercise.reps * Math.abs(exercise.weight);
        const totalSets = exercise.sets;
  
        if (!aggregatedData[key]) {
          aggregatedData[key] = { totalVolume: 0, totalSets: 0 };
        }
        aggregatedData[key].totalVolume += totalVolume;
        aggregatedData[key].totalSets += totalSets;
  
        // Track max weight lifted (remains unchanged)
        if (!maxWeightByExercise[key]) {
          maxWeightByExercise[key] = exercise.weight;
        } else {
          maxWeightByExercise[key] = Math.max(
            maxWeightByExercise[key],
            exercise.weight
          );
        }
      });
  
      // For each exercise key, calculate the average volume per set
      Object.keys(aggregatedData).forEach((key) => {
        const { totalVolume, totalSets } = aggregatedData[key];
        const avgVolume = totalSets > 0 ? totalVolume / totalSets : 0;
        if (!avgVolumeData[key]) {
          avgVolumeData[key] = [];
        }
        avgVolumeData[key].push({
          date: new Date(workout.workoutDate),
          avgVolume,
        });
  
        // Save max weight info (unchanged)
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
  
    // Calculate workout frequency information
    const totalWorkouts = sortedWorkouts.length;
    const uniqueDates = [
      ...new Set(sortedWorkouts.map((workout) => workout.workoutDate)),
    ];
    const workoutFrequency = `You worked out on ${totalWorkouts} days, covering ${uniqueDates.length} unique days.`;
  
    // Build analytics grouped by muscle group and exercise, using average volume per set
    const muscleGroupAnalytics = {};
    Object.keys(avgVolumeData).forEach((exerciseKey) => {
      const [muscleGroup, exerciseName] = exerciseKey.split("-");
      const entries = avgVolumeData[exerciseKey];
      entries.sort((a, b) => a.date - b.date);
  
      if (!muscleGroupAnalytics[muscleGroup]) {
        muscleGroupAnalytics[muscleGroup] = { exercises: {} };
      }
      if (!muscleGroupAnalytics[muscleGroup].exercises[exerciseName]) {
        muscleGroupAnalytics[muscleGroup].exercises[exerciseName] = { metrics: [] };
      }
      const metrics = muscleGroupAnalytics[muscleGroup].exercises[exerciseName].metrics;
  
      if (entries.length > 1) {
        const initialAvg = entries[0].avgVolume;
        const latestAvg = entries[entries.length - 1].avgVolume;
        const overallChange =
          initialAvg === 0 ? latestAvg * 100 : ((latestAvg - initialAvg) / initialAvg) * 100;
        metrics.push(
          `• Average volume per set changed from ${initialAvg.toFixed(
            2
          )} to ${latestAvg.toFixed(2)} (a change of ${overallChange.toFixed(2)}%).`
        );
  
        // Calculate the average percentage change between consecutive workouts
        let totalPercChange = 0;
        let count = 0;
        for (let i = 1; i < entries.length; i++) {
          const prev = entries[i - 1].avgVolume;
          const curr = entries[i].avgVolume;
          const change = prev === 0 ? curr * 100 : ((curr - prev) / prev) * 100;
          totalPercChange += change;
          count++;
        }
        const avgPercChange = count > 0 ? totalPercChange / count : 0;
        metrics.push(
          `• Average change between workouts: ${avgPercChange.toFixed(2)}%.`
        );
  
        // Recent change between the last two workouts
        const previousAvg = entries[entries.length - 2].avgVolume;
        const recentAvg = entries[entries.length - 1].avgVolume;
        const recentChange =
          previousAvg === 0 ? recentAvg * 100 : ((recentAvg - previousAvg) / previousAvg) * 100;
        metrics.push(
          `• Change since last workout: ${recentChange.toFixed(2)}% (from ${previousAvg.toFixed(
            2
          )} to ${recentAvg.toFixed(2)}).`
        );
      } else {
        metrics.push(
          `• Not enough data to analyze average volume per set for ${exerciseName}.`
        );
      }
  
      // Max Weight Analysis (retained for reference)
      const weightEntries = maxWeightData[exerciseKey] || [];
      if (weightEntries.length > 1) {
        weightEntries.sort((a, b) => a.date - b.date);
        const initialWeight = weightEntries[0].weight;
        const latestWeight = weightEntries[weightEntries.length - 1].weight;
        metrics.push(
          `• Max weight lifted increased from ${getWeightLabel(
            initialWeight
          )} to ${getWeightLabel(latestWeight)}.`
        );
        if (weightEntries.length > 1) {
          const previousWeight = weightEntries[weightEntries.length - 2].weight;
          metrics.push(
            `• Change in max weight from previous to recent: ${getWeightLabel(
              previousWeight
            )} -> ${getWeightLabel(latestWeight)}.`
          );
        }
        const allTimeMax = Math.max(...weightEntries.map((entry) => entry.weight));
        metrics.push(
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
