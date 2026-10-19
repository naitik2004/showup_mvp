"use client";
import Link from "next/link";
import { APP_ROUTES } from "@/lib/navigation";
import { useInvites } from "./hooks/useInvites";
import InviteCard from "./components/InviteCard";
import InvitesEmptyState from "./components/InvitesEmptyState";
import styles from "./invites.module.css";
export default function InvitesPage() {
  const invites = useInvites();
  return (
    <main className={`wrap ${styles.page}`} id="app">
      <section className="card">
        <h1 className={styles.title}>
          <Link href={APP_ROUTES.home}>Invites</Link>
        </h1>
        <p className="sy">Match invitations sent to you.</p>
        {invites.loading ? (
          <p role="status" className={styles.content}>
            Loading invitations…
          </p>
        ) : invites.error ? (
          <div className={`card emp ${styles.content}`} role="alert">
            <p>{invites.error}</p>
            <button
              className={`btn gh ${styles.browse}`}
              onClick={() => void invites.refresh()}
            >
              Retry
            </button>
          </div>
        ) : invites.invites.length ? (
          <div className={styles.content}>
            {invites.invites.map((invite) => (
              <InviteCard
                key={invite.id}
                invite={invite}
                busyId={invites.busyId}
                onRespond={invites.respond}
              />
            ))}
          </div>
        ) : (
          <InvitesEmptyState />
        )}
      </section>
    </main>
  );
}
