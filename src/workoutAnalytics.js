import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from "chart.js";
import { Line } from "react-chartjs-2";
import "./WorkoutAnalytics.css";

// Register Chart.js components for react-chartjs-2
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Convert AI's markdown-like text into basic HTML
const formatAIText = (text) => {
  let formatted = text;
  formatted = formatted.replace(/^### (.*)$/gm, "<h3>$1</h3>");
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  formatted = formatted.replace(/^- (.*)$/gm, "<li>$1</li>");
  formatted = formatted.replace(/(<li>.*?<\/li>)+/gs, (match) => `<ul>${match}</ul>`);
  return formatted;
};

// Calculate percentage change, handling negative weights (assistance)
const calculatePercentageChange = (current, previous) => {
  if (previous === 0) {
    return current === 0 ? 0 : (current > 0 ? 100 : -100);
  }
  
  // If both are negative (both assisted), calculate normally
  if (current < 0 && previous < 0) {
    return ((current - previous) / Math.abs(previous)) * 100;
  }
  
  // If going from assisted to weighted (negative to positive)
  if (previous < 0 && current > 0) {
    // This represents a significant improvement
    return ((Math.abs(previous) + current) / Math.abs(previous)) * 100;
  }
  
  // If going from weighted to assisted (positive to negative)
  if (previous > 0 && current < 0) {
    // This represents a regression
    return -((previous + Math.abs(current)) / previous) * 100;
  }
  
  // Both positive (normal calculation)
  return ((current - previous) / previous) * 100;
};

// A reusable chart sub-component to show progression for a single exercise
const ProgressionChart = ({ progression }) => {
  // Sort by date (oldest to newest) so chart lines go in correct order
  const sortedProg = [...progression].sort((a, b) => a.date - b.date);

  // Build arrays for the chart
  const labels = sortedProg.map((entry) =>
    entry.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  );
  const totalVolumeData = sortedProg.map((entry) => entry.totalVolume.toFixed(2));
  const avgVolumeData = sortedProg.map((entry) => entry.avgVolumePerSet.toFixed(2));
  // We'll store max weight as positive only
  const maxWeightData = sortedProg.map((entry) => Math.abs(entry.maxWeight).toFixed(2));

  // Chart.js dataset config
  const data = {
    labels,
    datasets: [
      {
        label: "Total Volume (kg)",
        data: totalVolumeData,
        yAxisID: "yVolume",
        borderColor: "#007bff",
        backgroundColor: "rgba(0, 123, 255, 0.3)",
        tension: 0.2
      },
      {
        label: "Avg Volume/Set (kg)",
        data: avgVolumeData,
        yAxisID: "yVolume",
        borderColor: "#28a745",
        backgroundColor: "rgba(40, 167, 69, 0.3)",
        tension: 0.2
      },
      {
        label: "Max Weight (kg)",
        data: maxWeightData,
        yAxisID: "yWeight",
        borderColor: "#ff6347",
        backgroundColor: "rgba(255, 99, 71, 0.3)",
        tension: 0.2
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false, // Make chart flexible in container
    interaction: {
      mode: "index",
      intersect: false
    },
    scales: {
      yVolume: {
        type: "linear",
        display: true,
        position: "left"
      },
      yWeight: {
        type: "linear",
        display: true,
        position: "right",
        grid: {
          drawOnChartArea: false // keep volumes and weight separate
        }
      }
    },
    plugins: {
      legend: { position: "top" },
      title: {
        display: false,
        text: "Progression Over Time"
      }
    }
  };

  return (
    <div className="chart-container">
      <Line data={data} options={options} />
    </div>
  );
};

const WorkoutAnalytics = ({ workouts }) => {
  const [analytics, setAnalytics] = useState({
    muscleGroupAnalytics: {},
    workoutFrequency: "",
  });
  const [expandedExercises, setExpandedExercises] = useState({});
  const [aiInsights, setAiInsights] = useState("");
  const [loadingAI, setLoadingAI] = useState(false);

  useEffect(() => {
    if (workouts.length > 0) {
      computeAnalytics();
    }
  }, [workouts]);

  // Compute detailed analytics across all workouts
  const computeAnalytics = () => {
    const overallAnalytics = {};
    const workoutDatesSet = new Set();

    // Merges pull/chin variations for simpler grouping
    const pullChinExercises = [
      "Pull Ups",
      "Assisted Pull Ups",
      "Chin Ups",
      "Assisted Chin-Ups"
    ];

    // Sort workouts by date (oldest to newest)
    const sortedWorkouts = [...workouts].sort(
      (a, b) => new Date(a.workoutDate) - new Date(b.workoutDate)
    );

    // Process each workout
    sortedWorkouts.forEach((workout) => {
      workoutDatesSet.add(workout.workoutDate);

      // Aggregate data for each exercise within the workout
      const workoutAgg = {};
      workout.exercises.forEach((exercise) => {
        let key = `${exercise.muscleGroup}-${exercise.exercise}`;

        // Combine back exercises under a single "Pull Up + Chin-Up" label
        if (
          exercise.muscleGroup === "Back" &&
          pullChinExercises.includes(exercise.exercise)
        ) {
          key = "Back-Pull Up + Chin-Up";
        }
        if (!workoutAgg[key]) {
          workoutAgg[key] = {
            totalVolume: 0,
            totalSets: 0,
            maxWeight: Number.NEGATIVE_INFINITY
          };
        }
        const volume = exercise.sets * exercise.reps * Math.abs(exercise.weight);
        workoutAgg[key].totalVolume += volume;
        workoutAgg[key].totalSets += exercise.sets;
        workoutAgg[key].maxWeight = Math.max(
          workoutAgg[key].maxWeight,
          exercise.weight
        );
      });

      // Merge current workout's aggregation into overallAnalytics
      Object.keys(workoutAgg).forEach((key) => {
        let muscleGroup, exerciseName;
        if (key === "Back-Pull Up + Chin-Up") {
          muscleGroup = "Back";
          exerciseName = "Pull Up / Chin-Up";
        } else {
          [muscleGroup, exerciseName] = key.split("-");
        }
        if (!overallAnalytics[muscleGroup]) {
          overallAnalytics[muscleGroup] = {};
        }
        if (!overallAnalytics[muscleGroup][exerciseName]) {
          overallAnalytics[muscleGroup][exerciseName] = {
            totalVolume: 0,
            totalSets: 0,
            workoutCount: 0,
            maxWeight: Number.NEGATIVE_INFINITY,
            progression: []
          };
        }

        const agg = workoutAgg[key];
        const record = overallAnalytics[muscleGroup][exerciseName];
        record.totalVolume += agg.totalVolume;
        record.totalSets += agg.totalSets;
        record.workoutCount += 1;
        record.maxWeight = Math.max(record.maxWeight, agg.maxWeight);
        record.progression.push({
          date: new Date(workout.workoutDate),
          totalVolume: agg.totalVolume,
          avgVolumePerSet: agg.totalSets > 0 ? agg.totalVolume / agg.totalSets : 0,
          maxWeight: agg.maxWeight
        });
      });
    });

    const totalWorkouts = sortedWorkouts.length;
    const uniqueDays = workoutDatesSet.size;
    const workoutFrequency = `You completed ${totalWorkouts} workout(s) on ${uniqueDays} unique day(s).`;

    // Build final analytics for UI
    const muscleGroupAnalytics = {};
    Object.keys(overallAnalytics).forEach((muscleGroup) => {
      muscleGroupAnalytics[muscleGroup] = { exercises: {} };
      Object.keys(overallAnalytics[muscleGroup]).forEach((exerciseName) => {
        const rec = overallAnalytics[muscleGroup][exerciseName];

        // Sort progression by date
        const sortedProg = rec.progression.sort((a, b) => a.date - b.date);

        // Calculate metrics with percentage changes
        let summaryMetrics = [];
        
        if (sortedProg.length > 0) {
          const latest = sortedProg[sortedProg.length - 1];
          const first = sortedProg[0];
          const previous = sortedProg.length > 1 ? sortedProg[sortedProg.length - 2] : null;

          // Total Volume per workout
          const totalVolumeFromPrev = previous ? 
            calculatePercentageChange(latest.totalVolume, previous.totalVolume) : 0;
          const totalVolumeFromFirst = 
            calculatePercentageChange(latest.totalVolume, first.totalVolume);
          
          summaryMetrics.push(`Total Volume: ${latest.totalVolume.toFixed(2)} kg`);
          if (previous) {
            summaryMetrics.push(`  • vs Previous: ${totalVolumeFromPrev >= 0 ? '+' : ''}${totalVolumeFromPrev.toFixed(1)}%`);
          }
          summaryMetrics.push(`  • vs First: ${totalVolumeFromFirst >= 0 ? '+' : ''}${totalVolumeFromFirst.toFixed(1)}%`);

          // Average Volume per set per workout
          const avgVolumeFromPrev = previous ? 
            calculatePercentageChange(latest.avgVolumePerSet, previous.avgVolumePerSet) : 0;
          const avgVolumeFromFirst = 
            calculatePercentageChange(latest.avgVolumePerSet, first.avgVolumePerSet);
          
          summaryMetrics.push(`Avg Volume/Set: ${latest.avgVolumePerSet.toFixed(2)} kg`);
          if (previous) {
            summaryMetrics.push(`  • vs Previous: ${avgVolumeFromPrev >= 0 ? '+' : ''}${avgVolumeFromPrev.toFixed(1)}%`);
          }
          summaryMetrics.push(`  • vs First: ${avgVolumeFromFirst >= 0 ? '+' : ''}${avgVolumeFromFirst.toFixed(1)}%`);

          // Max Weight lifted in workout
          const maxWeightFromPrev = previous ? 
            calculatePercentageChange(latest.maxWeight, previous.maxWeight) : 0;
          const maxWeightFromFirst = 
            calculatePercentageChange(latest.maxWeight, first.maxWeight);
          
          summaryMetrics.push(`Max Weight: ${getWeightLabel(latest.maxWeight)}`);
          if (previous) {
            summaryMetrics.push(`  • vs Previous: ${maxWeightFromPrev >= 0 ? '+' : ''}${maxWeightFromPrev.toFixed(1)}%`);
          }
          summaryMetrics.push(`  • vs First: ${maxWeightFromFirst >= 0 ? '+' : ''}${maxWeightFromFirst.toFixed(1)}%`);

          summaryMetrics.push(`Workout Count: ${rec.workoutCount}`);
        } else {
          summaryMetrics.push("No data available.");
        }

        muscleGroupAnalytics[muscleGroup].exercises[exerciseName] = {
          metrics: summaryMetrics,
          progression: rec.progression
        };
      });
    });

    setAnalytics({
      muscleGroupAnalytics,
      workoutFrequency
    });
  };

  // Show assisted weight if negative
  const getWeightLabel = (weight) => {
    return weight < 0
      ? `${Math.abs(weight)} kg (assisted)`
      : `${weight} kg`;
  };

  // Toggle detailed view for an exercise, including chart
  const toggleExerciseDetails = (muscleGroup, exerciseName) => {
    const key = `${muscleGroup}-${exerciseName}`;
    setExpandedExercises((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Minimal transform for AI analysis
  const transformWorkouts = (rawWorkouts) =>
    rawWorkouts.map((workout) => ({
      workoutName: workout.workoutName,
      workoutDate: workout.workoutDate,
      exercises: (workout.exercises || []).map((ex) => ({
        exercise: ex.exercise,
        sets: ex.sets,
        reps: ex.reps,
        weight: ex.weight,
        isAssistance: ex.isAssistance
      }))
    }));

  const handleAIAnalysis = async () => {
    if (!workouts || workouts.length === 0) return;
    setLoadingAI(true);
    setAiInsights("Analyzing your workouts with AI...");
    try {
      const minimalWorkouts = transformWorkouts(workouts);
      const response = await axios.post(
        process.env.REACT_APP_CHATBOT_API_URL,
        {
          userInput: "Analyze my workouts",
          workoutHistory: minimalWorkouts
        },
        { headers: { "Content-Type": "application/json" } }
      );
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
        <p className="workout-frequency">{analytics.workoutFrequency}</p>

        {/* AI Analysis */}
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

        {/* Muscle Group Sections */}
        {Object.keys(analytics.muscleGroupAnalytics).map((muscleGroup) => (
          <div key={muscleGroup} className="muscle-group-section">
            <h4>{muscleGroup}</h4>
            <div className="exercise-grid">
              {Object.keys(
                analytics.muscleGroupAnalytics[muscleGroup].exercises
              ).map((exerciseName) => {
                const { metrics, progression } =
                  analytics.muscleGroupAnalytics[muscleGroup].exercises[exerciseName];

                const isExpanded = expandedExercises[`${muscleGroup}-${exerciseName}`];

                return (
                  <div
                    key={exerciseName}
                    className="exercise-card"
                    onClick={() =>
                      toggleExerciseDetails(muscleGroup, exerciseName)
                    }
                  >
                    <h5>{exerciseName}</h5>
                    {isExpanded && (
                      <div className="exercise-details show">
                        <ul>
                          {metrics.map((m, idx) => (
                            <li key={idx}>{m}</li>
                          ))}
                        </ul>
                        {/* Chart for progression */}
                        <ProgressionChart progression={progression} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WorkoutAnalytics;