import { formatWeight, formatVolume } from "./weight";

const DAY_MS = 24 * 60 * 60 * 1000;

export const topLineStats = (workouts) => {
  if (!workouts || workouts.length === 0) {
    return { total: 0, daysTrained: 0, last7Days: 0, avgSessionSeconds: null };
  }
  const dates = new Set();
  let last7 = 0;
  let durationSum = 0;
  let durationCount = 0;
  const cutoff = Date.now() - 7 * DAY_MS;
  for (const w of workouts) {
    if (w.workoutDate) dates.add(w.workoutDate);
    if (w.workoutDate && new Date(w.workoutDate).getTime() >= cutoff) last7 += 1;
    if (w.durationSeconds && w.durationSeconds > 0) {
      durationSum += w.durationSeconds;
      durationCount += 1;
    }
  }
  return {
    total: workouts.length,
    daysTrained: dates.size,
    last7Days: last7,
    avgSessionSeconds: durationCount > 0 ? Math.round(durationSum / durationCount) : null,
  };
};

export const percentageChange = (current, previous) => {
  if (previous === 0) {
    return current === 0 ? 0 : current > 0 ? 100 : -100;
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

const daysSince = (date) => {
  if (!date) return null;
  const ms = Date.now() - (date instanceof Date ? date.getTime() : new Date(date).getTime());
  return Math.max(0, Math.floor(ms / DAY_MS));
};

export const formatDaysAgo = (days) => {
  if (days === null || days === undefined) return "—";
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
};

export const aggregateWorkouts = (workouts) => {
  if (!workouts || workouts.length === 0) {
    return { muscleGroupAnalytics: {}, workoutFrequency: "" };
  }

  const overall = {};
  const workoutDatesSet = new Set();
  // groupSessions[mg] = Map<dateISO, totalVolume>
  const groupSessions = {};

  const sortedWorkouts = [...workouts].sort(
    (a, b) => new Date(a.workoutDate) - new Date(b.workoutDate)
  );

  sortedWorkouts.forEach((workout) => {
    workoutDatesSet.add(workout.workoutDate);

    const agg = {};
    workout.exercises.forEach((exercise) => {
      const mg = exercise.muscleGroup;
      const ex = exercise.exercise;
      if (!agg[mg]) agg[mg] = {};
      if (!agg[mg][ex]) {
        agg[mg][ex] = { totalVolume: 0, totalSets: 0, maxWeight: Number.NEGATIVE_INFINITY };
      }
      agg[mg][ex].totalVolume += exercise.sets * exercise.reps * exercise.weight;
      agg[mg][ex].totalSets += exercise.sets;
      agg[mg][ex].maxWeight = Math.max(agg[mg][ex].maxWeight, exercise.weight);
    });

    Object.keys(agg).forEach((mg) => {
      // Group session totals (sum volume across this group's exercises in this workout)
      const groupVolThisWorkout = Object.values(agg[mg]).reduce(
        (s, x) => s + x.totalVolume,
        0
      );
      if (!groupSessions[mg]) groupSessions[mg] = [];
      groupSessions[mg].push({
        date: new Date(workout.workoutDate),
        totalVolume: groupVolThisWorkout,
      });

      Object.keys(agg[mg]).forEach((ex) => {
        if (!overall[mg]) overall[mg] = {};
        if (!overall[mg][ex]) {
          overall[mg][ex] = {
            totalVolume: 0,
            totalSets: 0,
            workoutCount: 0,
            maxWeight: Number.NEGATIVE_INFINITY,
            progression: [],
          };
        }
        const a = agg[mg][ex];
        const r = overall[mg][ex];
        r.totalVolume += a.totalVolume;
        r.totalSets += a.totalSets;
        r.workoutCount += 1;
        r.maxWeight = Math.max(r.maxWeight, a.maxWeight);
        r.progression.push({
          date: new Date(workout.workoutDate),
          totalVolume: a.totalVolume,
          avgVolumePerSet: a.totalSets > 0 ? a.totalVolume / a.totalSets : 0,
          maxWeight: a.maxWeight,
          totalSets: a.totalSets,
        });
      });
    });
  });

  const workoutFrequency = `You completed ${sortedWorkouts.length} workout(s) on ${workoutDatesSet.size} unique day(s).`;

  const muscleGroupAnalytics = {};
  Object.keys(overall).forEach((mg) => {
    const exercises = {};
    Object.keys(overall[mg]).forEach((ex) => {
      exercises[ex] = buildExerciseAnalytics(overall[mg][ex]);
    });

    muscleGroupAnalytics[mg] = {
      exercises,
      sessionVolumes: groupSessions[mg] || [],
      stats: buildGroupStats(overall[mg], groupSessions[mg] || []),
    };
  });

  return { muscleGroupAnalytics, workoutFrequency };
};

const buildExerciseAnalytics = (rec) => {
  const sortedProg = rec.progression.slice().sort((a, b) => a.date - b.date);

  if (sortedProg.length === 0) {
    return {
      maxWeightTrend: null,
      summary: [],
      progression: [],
      personalBest: null,
      daysSinceLast: null,
      recentSessions: [],
    };
  }

  const latest = sortedProg[sortedProg.length - 1];
  const previous = sortedProg.length > 1 ? sortedProg[sortedProg.length - 2] : null;

  const maxWeightTrend = previous ? percentageChange(latest.maxWeight, previous.maxWeight) : null;
  const volumeTrend = previous ? percentageChange(latest.totalVolume, previous.totalVolume) : null;

  // Personal best: max signed weight ever (negative weights = assisted; less negative = stronger).
  const pb = sortedProg.reduce((best, p) => (p.maxWeight > best.maxWeight ? p : best), sortedProg[0]);

  const summary = [
    { label: "Max Weight", value: formatWeight(latest.maxWeight), trend: maxWeightTrend },
    { label: "Total Volume", value: formatVolume(latest.totalVolume), trend: volumeTrend },
    { label: "Avg Volume/Set", value: formatVolume(latest.avgVolumePerSet), trend: null },
    {
      label: "Last Session",
      value: latest.date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      trend: null,
    },
    { label: "Sessions Logged", value: String(rec.workoutCount), trend: null },
  ];

  return {
    maxWeightTrend,
    summary,
    progression: sortedProg,
    personalBest: { weight: pb.maxWeight, date: pb.date },
    daysSinceLast: daysSince(latest.date),
    recentSessions: sortedProg
      .slice(-5)
      .reverse()
      .map((p) => ({
        date: p.date,
        totalSets: p.totalSets,
        maxWeight: p.maxWeight,
      })),
  };
};

const buildGroupStats = (groupExercises, sessionVolumes) => {
  if (sessionVolumes.length === 0) {
    return {
      sessions: 0,
      totalVolume: 0,
      lastTrainedDays: null,
      avgVolumePerSession: 0,
      topExercise: null,
      sessionTrend: null,
    };
  }

  const sorted = sessionVolumes.slice().sort((a, b) => a.date - b.date);
  const sessions = sorted.length;
  const totalVolume = sorted.reduce((s, x) => s + x.totalVolume, 0);
  const lastTrainedDays = daysSince(sorted[sorted.length - 1].date);
  const avgVolumePerSession = totalVolume / sessions;

  let topExerciseName = null;
  let topExerciseVol = Number.NEGATIVE_INFINITY;
  Object.keys(groupExercises).forEach((ex) => {
    if (groupExercises[ex].totalVolume > topExerciseVol) {
      topExerciseVol = groupExercises[ex].totalVolume;
      topExerciseName = ex;
    }
  });

  const sessionTrend =
    sessions > 1
      ? percentageChange(sorted[sessions - 1].totalVolume, sorted[sessions - 2].totalVolume)
      : null;

  return {
    sessions,
    totalVolume,
    lastTrainedDays,
    avgVolumePerSession,
    topExercise: topExerciseName,
    sessionTrend,
  };
};
