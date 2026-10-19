import Link from "next/link";
import { APP_ROUTES } from "@/lib/navigation";
import { Match } from "@/lib/matches";
import { SPORTS } from "@/types";
import { ProfileTab } from "../hooks/useProfileDashboard";
export default function ProfileMatchesSection({
  tab,
  onTabChange,
  matches,
  loading,
  error,
  onRetry,
}: {
  tab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
  matches: Match[];
  loading: boolean;
  error: string | null;
  onRetry: () => Promise<void>;
}) {
  return (
    <section aria-label="Your matches">
      <div className="chips" role="tablist" aria-label="Match history">
        {(["Hosting", "Joined", "Past"] as const).map((label) => (
          <button
            role="tab"
            aria-selected={tab === label}
            className={`chip ${tab === label ? "on" : ""}`}
            key={label}
            onClick={() => onTabChange(label)}
          >
            {label}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="card emp" role="status">
          Loading matches…
        </div>
      ) : error ? (
        <div className="card emp" role="alert">
          <p>{error}</p>
          <button className="btn" onClick={() => void onRetry()}>
            Try again
          </button>
        </div>
      ) : matches.length ? (
        <div className="lst">
          {matches.map((game) => (
            <Link href={`/groups/${game.id}`} key={game.id} className="card">
              <span className={`pl ${game.status}`}>{game.status}</span>
              <h3>
                {SPORTS.find((sport) => sport.id === game.sport)?.emoji}{" "}
                {game.title ||
                  SPORTS.find((sport) => sport.id === game.sport)?.name}
              </h3>
              <p>{game.venue}</p>
              <p>{new Date(game.starts_at).toLocaleString()}</p>
              <span className="mono">
                {game.member_count} of {game.max_players} players
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="card emp">
          <h3>
            {tab === "Hosting"
              ? "You haven't hosted a match yet"
              : tab === "Joined"
                ? "You haven't joined a match yet"
                : "No completed matches yet"}
          </h3>
          <Link
            className="btn hot"
            href={tab === "Hosting" ? APP_ROUTES.host : APP_ROUTES.home}
          >
            {tab === "Hosting" ? "Host a game" : "Find a match"}
          </Link>
        </div>
      )}
    </section>
  );
}
