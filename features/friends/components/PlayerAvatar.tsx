import styles from "../friends.module.css";
export default function PlayerAvatar({ name }: { name: string }) {
  return (
    <span className={styles["fr-avatar"]} aria-hidden="true">
      {name.trim().slice(0, 1).toUpperCase() || "P"}
    </span>
  );
}
