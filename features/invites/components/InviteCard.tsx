import { SPORTS } from "@/types";
import { MatchInvite } from "../types";
import styles from "../invites.module.css";
export default function InviteCard({
  invite,
  busyId,
  onRespond,
}: {
  invite: MatchInvite;
  busyId: string;
  onRespond: (id: string, action: "accept" | "decline") => Promise<void>;
}) {
  const sport = SPORTS.find((item) => item.id === invite.game?.sport);
  return (
    <article className={`mem ${styles.invite}`}>
      <i className="av" aria-hidden="true">
        {(invite.sender?.name || "P").charAt(0).toUpperCase()}
      </i>
      <div>
        <b>
          {invite.sender?.name || "A player"} invited you to{" "}
          {sport?.name || "a match"}
        </b>
        <br />
        <small>
          {invite.game?.venue || invite.sender?.city || "ShowUp"} ·{" "}
          {invite.game
            ? new Date(invite.game.starts_at).toLocaleString("en-IN", {
                dateStyle: "medium",
                timeStyle: "short",
              })
            : "Match details unavailable"}
        </small>
      </div>
      <div className={`acts ${styles.actions}`}>
        <button
          className="btn hot"
          disabled={
            Boolean(busyId) || !invite.game || invite.game.status !== "open"
          }
          onClick={() => void onRespond(invite.id, "accept")}
        >
          {busyId === invite.id ? "Working…" : "Accept"}
        </button>
        <button
          className="btn gh"
          disabled={Boolean(busyId)}
          onClick={() => void onRespond(invite.id, "decline")}
        >
          Decline
        </button>
      </div>
    </article>
  );
}
