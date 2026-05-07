import React, { useMemo, useState } from "react";
import { Clock, ChevronDown, Pencil, Trash2 } from "lucide-react";
import { toast } from "react-toastify";

import { useDeleteWorkout } from "./hooks/useWorkouts";
import { formatDuration, formatTimeOfDay } from "./lib/duration";
import IconButton from "./components/IconButton";
import "./getWorkouts.css";

const MONTH_FORMATTER = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" });

const groupByMonth = (workouts) => {
  const groups = new Map();
  for (const w of workouts) {
    const date = w.workoutDate ? new Date(w.workoutDate) : null;
    const key = date ? MONTH_FORMATTER.format(date) : "Unknown";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(w);
  }
  return Array.from(groups.entries());
};

const relativeDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const GetWorkouts = ({ workouts, onEditWorkout, onEmptyAction }) => {
  const [expandedId, setExpandedId] = useState(null);
  const deleteMutation = useDeleteWorkout();

  const sortedWorkouts = useMemo(
    () =>
      workouts
        ? [...workouts].sort((a, b) => new Date(b.workoutDate) - new Date(a.workoutDate))
        : [],
    [workouts]
  );

  const grouped = useMemo(() => groupByMonth(sortedWorkouts), [sortedWorkouts]);

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleDelete = (workoutID) => {
    const userID = localStorage.getItem("email");
    if (!userID) {
      toast.error("You are not authenticated. Please log in again.");
      return;
    }
    if (!window.confirm("Delete this workout?")) return;
    deleteMutation.mutate({ workoutID, userID });
  };

  if (sortedWorkouts.length === 0) {
    return (
      <div className="history">
        <h2 className="history__title">History</h2>
        <div className="empty">
          <p className="empty__text">No workouts logged yet.</p>
          {onEmptyAction && (
            <button type="button" className="empty__action" onClick={onEmptyAction}>
              Log your first workout
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="history">
      <h2 className="history__title">History</h2>

      {grouped.map(([month, items]) => (
        <section key={month} className="history__group">
          <h3 className="history__month">{month}</h3>
          <ul className="history__list">
            {items.map((workout) => {
              const isOpen = expandedId === workout.workoutID;
              return (
                <li key={workout.workoutID} className={`workout ${isOpen ? "is-open" : ""}`}>
                  <button
                    type="button"
                    className="workout__header"
                    onClick={() => toggleExpand(workout.workoutID)}
                    aria-expanded={isOpen}
                  >
                    <div className="workout__main">
                      <div className="workout__name">
                        {workout.workoutName || "Untitled Workout"}
                      </div>
                      <div className="workout__meta">
                        <span>{relativeDate(workout.workoutDate)}</span>
                        <span className="workout__dot">·</span>
                        <span>{(workout.exercises || []).length} exercises</span>
                        {workout.durationSeconds > 0 && (
                          <>
                            <span className="workout__dot">·</span>
                            <span className="workout__duration">
                              <Clock size={12} />
                              {formatDuration(workout.durationSeconds)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <ChevronDown
                      size={18}
                      className={`workout__chevron ${isOpen ? "is-open" : ""}`}
                    />
                  </button>

                  {isOpen && (
                    <div className="workout__body">
                      {(workout.startedAt || workout.endedAt) && (
                        <div className="workout__times">
                          {workout.startedAt && (
                            <span>
                              Started <strong>{formatTimeOfDay(workout.startedAt)}</strong>
                            </span>
                          )}
                          {workout.endedAt && (
                            <>
                              <span className="workout__dot">·</span>
                              <span>
                                Ended <strong>{formatTimeOfDay(workout.endedAt)}</strong>
                              </span>
                            </>
                          )}
                        </div>
                      )}
                      <ul className="workout__exercises">
                        {(workout.exercises || []).map((ex, i) => {
                          const w = Math.abs(Number(ex.weight) || 0);
                          return (
                            <li key={i} className="workout__exercise">
                              <span className="workout__ex-name">{ex.exercise}</span>
                              <span className="workout__ex-meta">
                                {ex.sets}×{ex.reps} @ {w} {ex.weightType}
                                {ex.isAssistance ? " · assisted" : ""}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                      <div className="workout__actions">
                        <IconButton
                          icon={Pencil}
                          label="Edit workout"
                          onClick={() => onEditWorkout?.(workout)}
                        />
                        <IconButton
                          icon={Trash2}
                          label="Delete workout"
                          variant="danger"
                          onClick={() => handleDelete(workout.workoutID)}
                          disabled={deleteMutation.isPending}
                        />
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
};

export default GetWorkouts;
