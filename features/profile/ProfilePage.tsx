"use client";
import ProfilePrivacy from './components/ProfilePrivacy';
import Link from "next/link";
import { toast } from "sonner";
import { APP_ROUTES } from "@/lib/navigation";
import { useProfileDashboard } from "./hooks/useProfileDashboard";
import ProfileIdentity from "./components/ProfileIdentity";
import ProfileStats from "./components/ProfileStats";
import ProfileMatchesSection from "./components/ProfileMatchesSection";
import ProfileSportsSection from "./components/ProfileSportsSection";
import styles from "./profile.module.css";
export default function ProfilePage() {
  const profile = useProfileDashboard();
  return (
    <main className={`wrap ${styles.page}`} id="app">
      <h1 className="ph">
        <Link href={APP_ROUTES.home}>Your profile</Link>
      </h1>
      <div className="stack">
        <ProfileIdentity user={profile.user} />
        <ProfileStats
          stats={profile.stats}
          loading={profile.loading}
          error={profile.error}
        />
        <ProfileMatchesSection
          viewerId={profile.viewerId}
          tab={profile.tab}
          onTabChange={profile.setTab}
          matches={profile.shown}
          loading={profile.loading}
          error={profile.error}
          onRetry={profile.refresh}
        />
        <ProfileSportsSection sports={profile.user?.preferred_sports || []} />
        <ProfilePrivacy />
        <div className="acts">
          <button
            className="btn gh"
            onClick={() => {
              void profile
                .signOut()
                .catch((cause) =>
                  toast.error(cause.message || "Could not sign out."),
                );
            }}
          >
            Sign out
          </button>
        </div>
      </div>
    </main>
  );
}
