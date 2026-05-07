import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { Clock, Pencil, Trash2, Timer, X } from "lucide-react";
import "react-toastify/dist/ReactToastify.css";

import { EXERCISES_BY_GROUP, MUSCLE_GROUPS, WEIGHT_TYPES } from "./data/exercises";
import { useRestTimer } from "./hooks/useRestTimer";
import { useElapsed } from "./hooks/useElapsed";
import { clearDraft, loadDraft, useFormDraft } from "./hooks/useFormDraft";
import { useSaveWorkout, useUpdateWorkout, useWorkouts } from "./hooks/useWorkouts";
import { toSignedWeight } from "./lib/weight";
import { computeDurationSeconds, formatDuration, formatTimeOfDay } from "./lib/duration";
import SegmentedControl from "./components/SegmentedControl";
import ChipRow from "./components/ChipRow";
import IconButton from "./components/IconButton";
import "./uploadWorkout.css";

const DRAFT_KEY = "currentWorkout";
const REST_PRESETS = [60, 90, 120, 180];
const EMPTY_EXERCISE = {
  muscleGroup: "",
  exercise: "",
  sets: "",
  reps: "",
  weight: "",
  weightType: "kg",
  isAssistance: false,
};

const todayISO = () => new Date().toISOString().split("T")[0];

const formatRest = (s) =>
  `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

const formatPreset = (s) => (s >= 120 ? `${s / 60}m` : `${s}s`);

const formatShortDate = (iso) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });

const UploadWorkout = ({ onWorkoutSave = () => {}, editingWorkout }) => {
  const { data: workouts = [] } = useWorkouts();
  const saveMutation = useSaveWorkout();
  const updateMutation = useUpdateWorkout();
  const isSubmitting = saveMutation.isPending || updateMutation.isPending;

  const [workoutName, setWorkoutName] = useState("");
  const [workoutDate, setWorkoutDate] = useState(todayISO);
  const [exercises, setExercises] = useState([]);
  const [currentExercise, setCurrentExercise] = useState(EMPTY_EXERCISE);
  const [editIndex, setEditIndex] = useState(null);
  const [setLogging, setSetLogging] = useState(false);
  const [startedAt, setStartedAt] = useState(null);

  const restTimer = useRestTimer(90);
  const elapsedSeconds = useElapsed(startedAt);

  useEffect(() => {
    const draft = loadDraft(DRAFT_KEY);
    if (!draft) return;
    if (draft.workoutName) setWorkoutName(draft.workoutName);
    if (draft.workoutDate) setWorkoutDate(draft.workoutDate);
    if (Array.isArray(draft.exercises)) setExercises(draft.exercises);
    if (draft.currentExercise) setCurrentExercise(draft.currentExercise);
    if (draft.startedAt) setStartedAt(draft.startedAt);
  }, []);

  useEffect(() => {
    if (!editingWorkout) return;
    setWorkoutName(editingWorkout.workoutName || "");
    setWorkoutDate(editingWorkout.workoutDate || "");
    setExercises(editingWorkout.exercises || []);
    setStartedAt(
      editingWorkout.startedAt ? new Date(editingWorkout.startedAt).getTime() : null
    );
  }, [editingWorkout]);

  useFormDraft(DRAFT_KEY, {
    workoutName,
    workoutDate,
    exercises,
    currentExercise,
    startedAt,
  });

  const recentWorkouts = useMemo(() => {
    if (!workouts || workouts.length === 0) return [];
    return [...workouts]
      .sort((a, b) => new Date(b.workoutDate) - new Date(a.workoutDate))
      .slice(0, 10);
  }, [workouts]);

  const lastExerciseInfo = useMemo(() => {
    if (!currentExercise.exercise || !workouts || workouts.length === 0) return null;
    const sorted = [...workouts].sort(
      (a, b) => new Date(b.workoutDate) - new Date(a.workoutDate)
    );
    for (const workout of sorted) {
      const match = workout.exercises.find((ex) => ex.exercise === currentExercise.exercise);
      if (!match) continue;
      const date = formatShortDate(workout.workoutDate);
      const w = Math.abs(match.weight);
      const tag = match.isAssistance
        ? `${w} ${match.weightType} (assisted)`
        : `${w} ${match.weightType}`;
      return `Last: ${match.sets}×${match.reps} @ ${tag} on ${date}`;
    }
    return null;
  }, [currentExercise.exercise, workouts]);

  const loadWorkoutTemplate = (workout) => {
    setWorkoutName(workout.workoutName || "");
    setExercises(workout.exercises.map((ex) => ({ ...ex })));
    toast.success("Workout loaded — update weights and save.");
  };

  const updateField = (field, value) => {
    setCurrentExercise((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setWorkoutName("");
    setWorkoutDate(todayISO());
    setExercises([]);
    setCurrentExercise(EMPTY_EXERCISE);
    setEditIndex(null);
    setStartedAt(null);
    clearDraft(DRAFT_KEY);
  };

  const addOrUpdateExercise = () => {
    const { muscleGroup, exercise, sets, reps, weight } = currentExercise;
    if (!muscleGroup || !exercise || !sets || !reps || !weight) {
      toast.error("Please fill out all fields for the exercise.");
      return;
    }

    const newExercise = { ...currentExercise };

    if (editIndex !== null) {
      setExercises((prev) => {
        const next = [...prev];
        next[editIndex] = newExercise;
        return next;
      });
      setEditIndex(null);
      toast.success("Exercise updated.");
    } else {
      setExercises((prev) => [...prev, newExercise]);
      toast.success("Exercise added.");
      restTimer.start(restTimer.duration);
      // Stamp the workout start the moment the first exercise is logged.
      // Editing an existing workout keeps its original start time.
      if (!startedAt) setStartedAt(Date.now());
    }

    setCurrentExercise((prev) =>
      setLogging
        ? { ...prev, sets: "1", reps: "", weight: "" }
        : { ...EMPTY_EXERCISE, muscleGroup: prev.muscleGroup }
    );
  };

  const editExercise = (index) => {
    setCurrentExercise(exercises[index]);
    setEditIndex(index);
  };

  const deleteExercise = (index) => {
    setExercises((prev) => prev.filter((_, i) => i !== index));
    toast.success("Exercise removed.");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const userID = localStorage.getItem("email");
    if (!userID) {
      toast.error("You are not authenticated. Please log in again.");
      return;
    }
    if (!workoutDate) {
      toast.error("Please provide a workout date.");
      return;
    }

    const endedAtMs = Date.now();
    const startedAtMs = startedAt || endedAtMs;
    const durationSeconds = computeDurationSeconds(startedAtMs, endedAtMs);

    const payload = {
      userID,
      workoutID: editingWorkout?.workoutID || null,
      workoutName: workoutName || "Untitled Workout",
      workoutDate,
      startedAt: new Date(startedAtMs).toISOString(),
      endedAt: new Date(endedAtMs).toISOString(),
      durationSeconds,
      exercises: exercises.map((ex) => ({
        muscleGroup: ex.muscleGroup,
        exercise: ex.exercise,
        sets: Number(ex.sets),
        reps: Number(ex.reps),
        weight: toSignedWeight({ weight: ex.weight, isAssistance: ex.isAssistance }),
        weightType: ex.weightType,
        isAssistance: ex.isAssistance,
      })),
    };

    const mutation = editingWorkout ? updateMutation : saveMutation;
    mutation.mutate(payload, {
      onSuccess: () => {
        onWorkoutSave();
        resetForm();
      },
    });
  };

  const exerciseOptions = currentExercise.muscleGroup
    ? EXERCISES_BY_GROUP[currentExercise.muscleGroup]
    : [];

  return (
    <div className="upload">
      {restTimer.isRunning && (
        <div className="rest-banner" role="status" aria-live="polite">
          <Timer size={18} />
          <span className="rest-banner__time">Rest {formatRest(restTimer.seconds)}</span>
          <button type="button" className="rest-banner__skip" onClick={restTimer.stop}>
            Skip
          </button>
        </div>
      )}

      <div className="upload__heading">
        <h2 className="upload__title">
          {editingWorkout ? "Edit Workout" : "Log a Workout"}
        </h2>
        {startedAt && (
          <div className="elapsed-badge" aria-live="polite">
            <Clock size={14} />
            <span className="elapsed-badge__started">
              Started {formatTimeOfDay(startedAt)}
            </span>
            <span className="elapsed-badge__sep">·</span>
            <span className="elapsed-badge__duration">
              {formatDuration(elapsedSeconds)}
            </span>
          </div>
        )}
      </div>

      {!editingWorkout && recentWorkouts.length > 0 && (
        <section className="card upload__recent">
          <header className="card__header">
            <h3 className="card__title">Repeat a workout</h3>
            <p className="card__subtitle">Tap to load and edit weights</p>
          </header>
          <div className="recent-row">
            {recentWorkouts.map((w, i) => (
              <button
                key={i}
                type="button"
                className="recent-card"
                onClick={() => loadWorkoutTemplate(w)}
              >
                <span className="recent-card__name">
                  {w.workoutName || "Untitled"}
                </span>
                <span className="recent-card__meta">
                  {formatShortDate(w.workoutDate)} · {w.exercises.length} ex
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      <form className="upload__form" onSubmit={handleSubmit}>
        <section className="card">
          <header className="card__header">
            <h3 className="card__title">Workout details</h3>
          </header>
          <div className="field-row field-row--two">
            <label className="field">
              <span className="field__label">Name</span>
              <input
                type="text"
                placeholder="e.g. Push Day"
                value={workoutName}
                onChange={(e) => setWorkoutName(e.target.value)}
                className="field__input"
              />
            </label>
            <label className="field">
              <span className="field__label">Date</span>
              <input
                type="date"
                value={workoutDate}
                onChange={(e) => setWorkoutDate(e.target.value)}
                className="field__input"
                required
              />
            </label>
          </div>
        </section>

        <section className="card">
          <header className="card__header">
            <h3 className="card__title">
              {editIndex !== null ? "Edit exercise" : "Add exercise"}
            </h3>
          </header>

          <div className="field">
            <span className="field__label">Muscle group</span>
            <ChipRow
              options={MUSCLE_GROUPS}
              value={currentExercise.muscleGroup}
              onChange={(v) => updateField("muscleGroup", v)}
              ariaLabel="Muscle group"
            />
          </div>

          <label className="field">
            <span className="field__label">Exercise</span>
            <select
              value={currentExercise.exercise}
              onChange={(e) => updateField("exercise", e.target.value)}
              disabled={!currentExercise.muscleGroup}
              className="field__select"
            >
              <option value="">
                {currentExercise.muscleGroup
                  ? "Select exercise"
                  : "Choose a muscle group first"}
              </option>
              {exerciseOptions.map((ex) => (
                <option key={ex} value={ex}>{ex}</option>
              ))}
            </select>
          </label>

          {lastExerciseInfo && (
            <p className="field-hint">{lastExerciseInfo}</p>
          )}

          <div className="field-row field-row--three">
            <label className="field">
              <span className="field__label">Sets</span>
              <input
                type="number"
                inputMode="numeric"
                placeholder="0"
                value={currentExercise.sets}
                onChange={(e) => updateField("sets", e.target.value)}
                className="field__input field__input--num"
              />
            </label>
            <label className="field">
              <span className="field__label">Reps</span>
              <input
                type="number"
                inputMode="numeric"
                placeholder="0"
                value={currentExercise.reps}
                onChange={(e) => updateField("reps", e.target.value)}
                className="field__input field__input--num"
              />
            </label>
            <label className="field">
              <span className="field__label">Weight</span>
              <input
                type="number"
                inputMode="decimal"
                placeholder="0"
                value={currentExercise.weight}
                onChange={(e) => updateField("weight", e.target.value)}
                className="field__input field__input--num"
              />
            </label>
          </div>

          <div className="field">
            <span className="field__label">Weight type</span>
            <SegmentedControl
              ariaLabel="Weight type"
              value={currentExercise.weightType}
              onChange={(v) => updateField("weightType", v)}
              options={WEIGHT_TYPES.map((t) => ({ value: t, label: t }))}
            />
          </div>

          <div className="field">
            <span className="field__label">Assistance</span>
            <SegmentedControl
              ariaLabel="Assistance"
              value={currentExercise.isAssistance}
              onChange={(v) => updateField("isAssistance", v)}
              options={[
                { value: false, label: "Regular" },
                { value: true, label: "Assisted" },
              ]}
            />
          </div>

          <label className="toggle">
            <input
              type="checkbox"
              className="toggle__input"
              checked={setLogging}
              onChange={(e) => setSetLogging(e.target.checked)}
            />
            <span className="toggle__track" aria-hidden="true">
              <span className="toggle__thumb" />
            </span>
            <span className="toggle__label">
              Log sets individually
              <span className="toggle__hint">Each add = 1 set; exercise stays selected</span>
            </span>
          </label>

          <button
            type="button"
            className="btn btn--primary btn--block"
            onClick={addOrUpdateExercise}
          >
            {editIndex !== null
              ? "Update exercise"
              : setLogging
              ? "Log set"
              : "Add exercise"}
          </button>

          {!restTimer.isRunning && exercises.length > 0 && (
            <div className="rest-presets" aria-label="Rest timer presets">
              <span className="rest-presets__label">Rest</span>
              {REST_PRESETS.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`rest-presets__btn ${restTimer.duration === s ? "is-active" : ""}`}
                  onClick={() => restTimer.start(s)}
                >
                  {formatPreset(s)}
                </button>
              ))}
            </div>
          )}
        </section>

        {exercises.length > 0 && (
          <section className="card">
            <header className="card__header">
              <h3 className="card__title">
                Current exercises <span className="card__count">{exercises.length}</span>
              </h3>
            </header>
            <ul className="ex-list">
              {exercises.map((ex, index) => {
                const w = Math.abs(Number(ex.weight) || 0);
                return (
                  <li key={index} className="ex-list__item">
                    <div className="ex-list__main">
                      <div className="ex-list__name">{ex.exercise}</div>
                      <div className="ex-list__meta">
                        {ex.sets}×{ex.reps} @ {w} {ex.weightType}
                        {ex.isAssistance ? " · assisted" : ""}
                      </div>
                    </div>
                    <div className="ex-list__actions">
                      <IconButton
                        icon={Pencil}
                        label="Edit exercise"
                        onClick={() => editExercise(index)}
                      />
                      <IconButton
                        icon={Trash2}
                        label="Delete exercise"
                        onClick={() => deleteExercise(index)}
                        variant="danger"
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn btn--primary btn--block btn--submit"
        >
          {isSubmitting
            ? "Saving…"
            : editingWorkout
            ? "Update workout"
            : "Save workout"}
        </button>

        {editingWorkout && (
          <button
            type="button"
            onClick={() => {
              onWorkoutSave();
              resetForm();
            }}
            className="btn btn--ghost btn--block"
          >
            <X size={16} /> Cancel edit
          </button>
        )}
      </form>
    </div>
  );
};

export default UploadWorkout;
