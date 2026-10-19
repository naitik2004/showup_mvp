"use client";
import { toast } from "sonner";
import styles from "../friends.module.css";
export default function PlayerIdCard({ playerId }: { playerId: string }) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(playerId);
      toast.success("Copied your player ID.");
    } catch {
      toast.error("Select your ID to copy it manually.");
    }
  };
  return (
    <aside className={styles["fr-id"]} aria-label="Your player ID">
      <span className={styles["fr-id__label"]}>Your player ID</span>
      <strong
        className={`${styles["fr-id__code"]} ${playerId.length > 12 ? styles["fr-id__code--legacy"] : ""}`}
      >
        {playerId}
      </strong>
      <p className={styles["fr-id__hint"]}>
        Unique to you and created with your account. Share it and anyone can
        find you in one search.
      </p>
      <div className={styles["fr-id__row"]}>
        <button className="btn hot sm" onClick={() => void copy()}>
          Copy my ID
        </button>
        <a className="btn gh sm" href={`/#/p/${playerId}`}>Public profile ↗</a>
      </div>
    </aside>
  );
}
