"use client";
import { useState } from "react";
import styles from "../friends.module.css";
export default function PlayerIdChip({ playerId }: { playerId: string }) {
  const [message, setMessage] = useState("");
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(playerId);
      setMessage("ID copied");
    } catch {
      setMessage("Select ID to copy");
    }
  };
  return (
    <button
      type="button"
      className={`${styles["fr-pid"]} ${playerId.length > 12 ? styles["fr-pid--legacy"] : ""}`}
      onClick={() => void copy()}
      title="Copy player ID"
      aria-label={`Copy player ID ${playerId}`}
    >
      {playerId}
      {message && <span role="status"> · {message}</span>}
    </button>
  );
}
