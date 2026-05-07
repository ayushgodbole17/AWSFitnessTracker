import React, { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Activity,
  Award,
  CalendarDays,
  ChevronDown,
  Clock,
  Dumbbell,
  Flame,
  LineChart,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

import ErrorBoundary from "./ErrorBoundary";
import MarkdownText from "./components/MarkdownText";
import StatCard from "./components/StatCard";
import { aggregateWorkouts, formatDaysAgo, topLineStats } from "./lib/analytics";
import { formatDuration } from "./lib/duration";
import { formatCompactVolume, formatWeight } from "./lib/weight";
import { requestAIInsights } from "./api/ai";
import { MUSCLE_GROUPS } from "./data/exercises";
import "./WorkoutAnalytics.css";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const MUSCLE_GROUP_ORDER = ["Chest", "Back", "Shoulders", "Legs", "Arms", "Abs"];

const formatShortDate = (date) =>
  date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

const MiniChart = React.memo(({ progression, field, label, color, height = 120 }) => {
  const data = useMemo(() => ({
    labels: progression.map((entry) => formatShortDate(entry.date)),
    datasets: [
      {
        label,
        data: progression.map((entry) => Number(entry[field].toFixed(2))),
        borderColor: color,
        backgroundColor: color + "22",
        tension: 0.25,
        pointRadius: 3,
        borderWidth: 2,
        fill: true,
      },
    ],
  }), [progression, field, label, color]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    scales: {
      y: {
        type: "linear",
        position: "left",
        ticks: { font: { size: 10 } },
        grid: {
          color: (ctx) => (ctx.tick && ctx.tick.value === 0 ? "#94a3b8" : "#e2e8f0"),
        },
      },
      x: {
        ticks: { font: { size: 10 }, maxRotation: 0, autoSkip: true, maxTicksLimit: 6 },
        grid: { display: false },
      },
    },
    plugins: {
      legend: { display: false },
      title: {
        display: !!label,
        text: label,
        font: { size: 11, weight: "600" },
        color: "#475569",
        padding: { bottom: 4 },
      },
      tooltip: { bodyFont: { size: 11 }, titleFont: { size: 11 } },
    },
  }), [label]);

  return (
    <div className="mini-chart" style={{ height }}>
      <Line data={data} options={options} />
    </div>
  );
});

const TrendBadge = ({ pct }) => {
  if (pct === null || !Number.isFinite(pct)) {
    return <span className="trend trend--neutral">—</span>;
  }
  const arrow = pct > 0 ? "▲" : pct < 0 ? "▼" : "•";
  const cls = pct > 0 ? "trend--up" : pct < 0 ? "trend--down" : "trend--neutral";
  return (
    <span className={`trend ${cls}`}>
      {arrow} {Math.abs(pct).toFixed(1)}%
    </span>
  );
};

const GroupOverview = ({ stats, sessionVolumes }) => (
  <div className="group-overview">
    <div className="group-overview__head">
      <span className="group-overview__eyebrow">Overview</span>
      {stats.topExercise && (
        <span className="group-overview__top">
          <Award size={12} /> {stats.topExercise}
        </span>
      )}
    </div>

    <div className="mini-stats">
      <div className="mini-stat">
        <div className="mini-stat__value">{stats.sessions}</div>
        <div className="mini-stat__label">Sessions</div>
      </div>
      <div className="mini-stat">
        <div className="mini-stat__value">{formatCompactVolume(stats.totalVolume)}</div>
        <div className="mini-stat__label">Total volume</div>
      </div>
      <div className="mini-stat">
        <div className="mini-stat__value">{formatDaysAgo(stats.lastTrainedDays)}</div>
        <div className="mini-stat__label">Last trained</div>
      </div>
      <div className="mini-stat">
        <div className="mini-stat__value mini-stat__value--with-trend">
          {formatCompactVolume(stats.avgVolumePerSession)}
          {stats.sessionTrend !== null && Number.isFinite(stats.sessionTrend) && (
            <span
              className={`mini-stat__delta ${stats.sessionTrend >= 0 ? "is-up" : "is-down"}`}
            >
              {stats.sessionTrend >= 0 ? "+" : ""}
              {stats.sessionTrend.toFixed(0)}%
            </span>
          )}
        </div>
        <div className="mini-stat__label">Avg / session</div>
      </div>
    </div>

    {sessionVolumes.length > 1 && (
      <div className="group-overview__chart">
        <div className="group-overview__chart-label">
          <TrendingUp size={12} />
          Volume by session
        </div>
        <ErrorBoundary>
          <MiniChart
            progression={sessionVolumes}
            field="totalVolume"
            label=""
            color="#2563eb"
            height={110}
          />
        </ErrorBoundary>
      </div>
    )}
  </div>
);

const RecentSessions = ({ sessions }) => {
  if (sessions.length === 0) return null;
  return (
    <div className="recent-sessions">
      <div className="recent-sessions__title">Recent sessions</div>
      <ul className="recent-sessions__list">
        {sessions.map((s, i) => (
          <li key={i} className="recent-sessions__item">
            <span className="recent-sessions__date">{formatShortDate(s.date)}</span>
            <span className="recent-sessions__sets">{s.totalSets} set{s.totalSets === 1 ? "" : "s"}</span>
            <span className="recent-sessions__weight">{formatWeight(s.maxWeight)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

const PersonalBest = ({ pb }) => {
  if (!pb) return null;
  return (
    <div className="pb-callout">
      <div className="pb-callout__icon">
        <Award size={18} />
      </div>
      <div className="pb-callout__body">
        <div className="pb-callout__label">Personal Best</div>
        <div className="pb-callout__value">
          {formatWeight(pb.weight)} <span className="pb-callout__date">· {formatShortDate(pb.date)}</span>
        </div>
      </div>
    </div>
  );
};

const ExerciseCard = React.memo(({ name, analytics, isExpanded, onToggle }) => {
  const { summary, progression, maxWeightTrend, personalBest, daysSinceLast, recentSessions } = analytics;
  const [showCharts, setShowCharts] = useState(false);

  return (
    <div className={`ex-card ${isExpanded ? "is-expanded" : ""}`}>
      <button
        type="button"
        className="ex-card__header"
        onClick={onToggle}
        aria-expanded={isExpanded}
      >
        <span className="ex-card__name">{name}</span>
        <span className="ex-card__trail">
          <TrendBadge pct={maxWeightTrend} />
          <ChevronDown
            size={16}
            className={`ex-card__chevron ${isExpanded ? "is-open" : ""}`}
          />
        </span>
      </button>

      {isExpanded && (
        <div className="ex-card__body">
          <PersonalBest pb={personalBest} />

          <dl className="metrics">
            {summary.map((m, idx) => (
              <div key={idx} className="metric">
                <dt className="metric__label">{m.label}</dt>
                <dd className="metric__value">
                  {m.value}
                  {m.trend !== null && Number.isFinite(m.trend) && (
                    <span
                      className={`metric__delta ${m.trend >= 0 ? "is-up" : "is-down"}`}
                    >
                      {m.trend >= 0 ? "+" : ""}
                      {m.trend.toFixed(1)}%
                    </span>
                  )}
                </dd>
              </div>
            ))}
            <div className="metric">
              <dt className="metric__label">Days Since</dt>
              <dd className="metric__value">{formatDaysAgo(daysSinceLast)}</dd>
            </div>
          </dl>

          <RecentSessions sessions={recentSessions} />

          <button
            type="button"
            className="ex-card__charts-toggle"
            onClick={() => setShowCharts((v) => !v)}
          >
            <LineChart size={14} />
            {showCharts ? "Hide charts" : "Show charts"}
          </button>

          {showCharts && (
            <ErrorBoundary>
              <MiniChart
                progression={progression}
                field="maxWeight"
                label="Max Weight"
                color="#2563eb"
              />
              <MiniChart
                progression={progression}
                field="totalVolume"
                label="Total Volume"
                color="#16a34a"
              />
            </ErrorBoundary>
          )}
        </div>
      )}
    </div>
  );
});

const WorkoutAnalytics = ({ workouts }) => {
  const [expandedExercises, setExpandedExercises] = useState({});
  const [expandedGroups, setExpandedGroups] = useState({});

  const aiMutation = useMutation({
    mutationFn: () => requestAIInsights(workouts),
    onError: (error) => console.error("Error with AI Analysis:", error),
  });

  const { muscleGroupAnalytics } = useMemo(
    () => aggregateWorkouts(workouts),
    [workouts]
  );

  const stats = useMemo(() => topLineStats(workouts), [workouts]);

  const toggleExercise = (mg, ex) => {
    const key = `${mg}::${ex}`;
    setExpandedExercises((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleGroup = (mg) => {
    setExpandedGroups((prev) => ({ ...prev, [mg]: !prev[mg] }));
  };

  if (!workouts || workouts.length === 0) {
    return (
      <div className="analytics">
        <h2 className="analytics__title">Insights</h2>
        <div className="empty">
          <p className="empty__text">Log your first workout to see analytics here.</p>
        </div>
      </div>
    );
  }

  const dataKeys = Object.keys(muscleGroupAnalytics);
  const orderedGroups = [
    ...MUSCLE_GROUP_ORDER,
    ...dataKeys.filter((k) => !MUSCLE_GROUP_ORDER.includes(k) && MUSCLE_GROUPS.indexOf(k) === -1),
  ];

  return (
    <div className="analytics">
      <h2 className="analytics__title">Insights</h2>

      <section className="stats-strip">
        <StatCard value={stats.total} label="Workouts" icon={Dumbbell} />
        <StatCard value={stats.daysTrained} label="Days trained" icon={CalendarDays} />
        <StatCard value={stats.last7Days} label="Last 7 days" icon={Flame} />
        <StatCard
          value={stats.avgSessionSeconds ? formatDuration(stats.avgSessionSeconds) : "—"}
          label="Avg session"
          icon={Clock}
        />
      </section>

      <section className="ai-card">
        <header className="ai-card__header">
          <Sparkles size={18} className="ai-card__icon" />
          <div>
            <h3 className="ai-card__title">AI Analysis</h3>
            <p className="ai-card__subtitle">Get personalized insights on your training</p>
          </div>
        </header>
        <button
          type="button"
          className="ai-card__btn"
          onClick={() => aiMutation.mutate()}
          disabled={aiMutation.isPending}
        >
          {aiMutation.isPending ? "Analyzing…" : "Analyze with AI"}
        </button>
        {aiMutation.isError && (
          <div className="ai-card__output ai-card__output--error">
            Couldn't get insights right now. Try again in a moment.
          </div>
        )}
        {aiMutation.isSuccess && (
          <div className="ai-card__output">
            <MarkdownText text={aiMutation.data} />
          </div>
        )}
      </section>

      <section className="groups">
        <h3 className="groups__title">By muscle group</h3>
        {orderedGroups.map((mg) => {
          const groupData = muscleGroupAnalytics[mg];
          const exercises = groupData ? Object.keys(groupData.exercises).sort() : [];
          const isOpen = !!expandedGroups[mg];
          const isEmpty = exercises.length === 0;

          return (
            <div key={mg} className={`group ${isOpen ? "is-open" : ""} ${isEmpty ? "is-empty" : ""}`}>
              <button
                type="button"
                className="group__header"
                onClick={() => !isEmpty && toggleGroup(mg)}
                aria-expanded={isOpen}
                disabled={isEmpty}
              >
                <span className="group__name">
                  <Activity size={16} className="group__icon" />
                  {mg}
                </span>
                <span className="group__trail">
                  <span className={`group__count ${isEmpty ? "is-empty" : ""}`}>
                    {exercises.length}
                  </span>
                  {!isEmpty && (
                    <ChevronDown
                      size={18}
                      className={`group__chevron ${isOpen ? "is-open" : ""}`}
                    />
                  )}
                </span>
              </button>

              {isOpen && !isEmpty && (
                <div className="group__body">
                  <GroupOverview
                    stats={groupData.stats}
                    sessionVolumes={groupData.sessionVolumes}
                  />

                  <div className="group__exercises-label">
                    Exercises
                  </div>

                  {exercises.map((ex) => {
                    const expandKey = `${mg}::${ex}`;
                    return (
                      <ExerciseCard
                        key={ex}
                        name={ex}
                        analytics={groupData.exercises[ex]}
                        isExpanded={!!expandedExercises[expandKey]}
                        onToggle={() => toggleExercise(mg, ex)}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </section>
    </div>
  );
};

export default WorkoutAnalytics;
