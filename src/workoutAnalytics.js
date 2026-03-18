import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import DOMPurify from "dompurify";
import { transformWorkouts } from "./utils";
import ErrorBoundary from "./ErrorBoundary";
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
  if (current < 0 && previous < 0) {
    return ((current - previous) / Math.abs(previous)) * 100;
  }
  if (previous < 0 && current > 0) {
    return ((Math.abs(previous) + current) / Math.abs(previous)) * 100;
  }
  if (previous > 0 && current < 0) {
    return -((previous + Math.abs(current)) / previous) * 100;
  }
  return ((current - previous) / previous) * 100;
};

// Pure helper — no component state needed
const getWeightLabel = (weight) =>
  weight < 0 ? `${Math.abs(weight)} kg (assisted)` : `${weight} kg`;

const ProgressionChart = ({ progression }) => {
  const sortedProg = [...progression].sort((a, b) => a.date - b.date);

  const labels = sortedProg.map((entry) =>
    entry.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  );
  const totalVolumeData = sortedProg.map((entry) => entry.totalVolume.toFixed(2));
  const avgVolumeData = sortedProg.map((entry) => entry.avgVolumePerSet.toFixed(2));
  const maxWeightData = sortedProg.map((entry) => Math.abs(entry.maxWeight).toFixed(2));

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
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    scales: {
      yVolume: { type: "linear", display: true, position: "left" },
      yWeight: {
        type: "linear",
        display: true,
        position: "right",
        grid: { drawOnChartArea: false }
      }
    },
    plugins: {
      legend: { position: "top" },
      title: { display: false }
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

  const computeAnalytics = useCallback(() => {
    const overallAnalytics = {};
    const workoutDatesSet = new Set();

    const pullChinExercises = [
      "Pull Ups",
      "Assisted Pull Ups",
      "Chin Ups",
      "Assisted Chin-Ups"
    ];

    const sortedWorkouts = [...workouts].sort(
      (a, b) => new Date(a.workoutDate) - new Date(b.workoutDate)
    );

    sortedWorkouts.forEach((workout) => {
      workoutDatesSet.add(workout.workoutDate);

      const workoutAgg = {};
      workout.exercises.forEach((exercise) => {
        let key = `${exercise.muscleGroup}-${exercise.exercise}`;
        if (
          exercise.muscleGroup === "Back" &&
          pullChinExercises.includes(exercise.exercise)
        ) {
          key = "Back-Pull Up + Chin-Up";
        }
        if (!workoutAgg[key]) {
          workoutAgg[key] = { totalVolume: 0, totalSets: 0, maxWeight: Number.NEGATIVE_INFINITY };
        }
        workoutAgg[key].totalVolume += exercise.sets * exercise.reps * Math.abs(exercise.weight);
        workoutAgg[key].totalSets += exercise.sets;
        workoutAgg[key].maxWeight = Math.max(workoutAgg[key].maxWeight, exercise.weight);
      });

      Object.keys(workoutAgg).forEach((key) => {
        let muscleGroup, exerciseName;
        if (key === "Back-Pull Up + Chin-Up") {
          muscleGroup = "Back";
          exerciseName = "Pull Up / Chin-Up";
        } else {
          [muscleGroup, exerciseName] = key.split("-");
        }
        if (!overallAnalytics[muscleGroup]) overallAnalytics[muscleGroup] = {};
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

    const workoutFrequency = `You completed ${sortedWorkouts.length} workout(s) on ${workoutDatesSet.size} unique day(s).`;

    const muscleGroupAnalytics = {};
    Object.keys(overallAnalytics).forEach((muscleGroup) => {
      muscleGroupAnalytics[muscleGroup] = { exercises: {} };
      Object.keys(overallAnalytics[muscleGroup]).forEach((exerciseName) => {
        const rec = overallAnalytics[muscleGroup][exerciseName];
        const sortedProg = rec.progression.sort((a, b) => a.date - b.date);

        let summaryMetrics = [];

        if (sortedProg.length > 0) {
          const latest = sortedProg[sortedProg.length - 1];
          const first = sortedProg[0];
          const previous = sortedProg.length > 1 ? sortedProg[sortedProg.length - 2] : null;

          const totalVolumeFromPrev = previous
            ? calculatePercentageChange(latest.totalVolume, previous.totalVolume) : null;
          const avgVolumeFromPrev = previous
            ? calculatePercentageChange(latest.avgVolumePerSet, previous.avgVolumePerSet) : null;
          const maxWeightFromPrev = previous
            ? calculatePercentageChange(latest.maxWeight, previous.maxWeight) : null;

          summaryMetrics = [
            {
              label: "Total Volume",
              value: `${latest.totalVolume.toFixed(2)} kg`,
              comparisons: [
                ...(totalVolumeFromPrev !== null ? [{ label: "vs Previous", pct: totalVolumeFromPrev }] : []),
                { label: "vs First", pct: calculatePercentageChange(latest.totalVolume, first.totalVolume) }
              ]
            },
            {
              label: "Avg Volume/Set",
              value: `${latest.avgVolumePerSet.toFixed(2)} kg`,
              comparisons: [
                ...(avgVolumeFromPrev !== null ? [{ label: "vs Previous", pct: avgVolumeFromPrev }] : []),
                { label: "vs First", pct: calculatePercentageChange(latest.avgVolumePerSet, first.avgVolumePerSet) }
              ]
            },
            {
              label: "Max Weight",
              value: getWeightLabel(latest.maxWeight),
              comparisons: [
                ...(maxWeightFromPrev !== null ? [{ label: "vs Previous", pct: maxWeightFromPrev }] : []),
                { label: "vs First", pct: calculatePercentageChange(latest.maxWeight, first.maxWeight) }
              ]
            },
            { label: "Workout Count", value: String(rec.workoutCount), comparisons: [] }
          ];
        } else {
          summaryMetrics = [{ label: "No data available", value: "", comparisons: [] }];
        }

        muscleGroupAnalytics[muscleGroup].exercises[exerciseName] = {
          metrics: summaryMetrics,
          progression: rec.progression
        };
      });
    });

    setAnalytics({ muscleGroupAnalytics, workoutFrequency });
  }, [workouts]);

  useEffect(() => {
    if (workouts.length > 0) {
      computeAnalytics();
    }
  }, [workouts, computeAnalytics]);

  const toggleExerciseDetails = (muscleGroup, exerciseName) => {
    const key = `${muscleGroup}-${exerciseName}`;
    setExpandedExercises((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleAIAnalysis = async () => {
    if (!workouts || workouts.length === 0) return;
    setLoadingAI(true);
    setAiInsights("Analyzing your workouts with AI...");
    try {
      const response = await axios.post(
        process.env.REACT_APP_CHATBOT_API_URL,
        { userInput: "Analyze my workouts", workoutHistory: transformWorkouts(workouts) },
        { headers: { "Content-Type": "application/json" } }
      );
      setAiInsights(response.data?.response || "No insights available.");
    } catch (error) {
      console.error("Error with AI Analysis:", error);
      setAiInsights("An error occurred while analyzing. Please try again later.");
    } finally {
      setLoadingAI(false);
    }
  };

  if (!workouts || workouts.length === 0) {
    return (
      <div className="analytics-title-container">
        <h2 className="analytics-title">Workout Analytics</h2>
        <p style={{ color: "#6c757d", marginTop: "20px" }}>
          Log your first workout to see analytics here.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="analytics-title-container">
        <h2 className="analytics-title">Workout Analytics</h2>
      </div>

      <div className="analytics-container">
        <p className="workout-frequency">{analytics.workoutFrequency}</p>

        {/* AI Analysis */}
        <div className="ai-analysis-section">
          <button className="ai-analyze-btn" onClick={handleAIAnalysis} disabled={loadingAI}>
            Analyze with AI
          </button>
          {aiInsights && (
            <div className="ai-insights">
              {loadingAI ? (
                <span>{aiInsights}</span>
              ) : (
                <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(formatAIText(aiInsights)) }} />
              )}
            </div>
          )}
        </div>

        {/* Muscle Group Sections */}
        {Object.keys(analytics.muscleGroupAnalytics).map((muscleGroup) => (
          <div key={muscleGroup} className="muscle-group-section">
            <h4>{muscleGroup}</h4>
            <div className="exercise-grid">
              {Object.keys(analytics.muscleGroupAnalytics[muscleGroup].exercises).map((exerciseName) => {
                const { metrics, progression } =
                  analytics.muscleGroupAnalytics[muscleGroup].exercises[exerciseName];
                const isExpanded = expandedExercises[`${muscleGroup}-${exerciseName}`];

                return (
                  <div
                    key={exerciseName}
                    className="exercise-card"
                    onClick={() => toggleExerciseDetails(muscleGroup, exerciseName)}
                  >
                    <h5>{exerciseName}</h5>
                    {isExpanded && (
                      <div className="exercise-details show">
                        <ul>
                          {metrics.map((metric, idx) => (
                            <li key={idx}>
                              <span className="metric-label">
                                {metric.label}{metric.value ? ":" : ""}
                              </span>
                              {metric.value && (
                                <span className="metric-value"> {metric.value}</span>
                              )}
                              {metric.comparisons.map((comp, cIdx) => (
                                <div
                                  key={cIdx}
                                  className={`metric-comparison ${comp.pct >= 0 ? "positive" : "negative"}`}
                                >
                                  {comp.label}: {comp.pct >= 0 ? "+" : ""}{comp.pct.toFixed(1)}%
                                </div>
                              ))}
                            </li>
                          ))}
                        </ul>
                        <ErrorBoundary>
                          <ProgressionChart progression={progression} />
                        </ErrorBoundary>
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
