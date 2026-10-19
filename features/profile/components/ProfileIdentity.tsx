import PlayerCode from '@/features/players/components/PlayerCode';
import { User } from "@/types";
export default function ProfileIdentity({ user }: { user: User | null }) {
  return (
    <section className="card id">
      <i className="av" aria-hidden="true">
        {(user?.name || "P").charAt(0).toUpperCase()}
      </i>
      <div>
        <h2>{user?.name || "Your profile"}</h2>
        <PlayerCode code={user?.player_id} />
        {user?.player_id && <a className="mono" style={{ marginLeft: 10 }} href={`/#/p/${user.player_id}`}>Public profile ↗</a>}
        <br />
        <span className="mono">
          {user?.city || "ShowUp"}
          {user?.created_at
            ? `, member since ${new Date(user.created_at).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}`
            : ""}
        </span>
      </div>
    </section>
  );
}
