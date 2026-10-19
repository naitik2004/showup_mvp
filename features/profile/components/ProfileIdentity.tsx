import { User } from "@/types";
export default function ProfileIdentity({ user }: { user: User | null }) {
  return (
    <section className="card id">
      <i className="av" aria-hidden="true">
        {(user?.name || "P").charAt(0).toUpperCase()}
      </i>
      <div>
        <h2>{user?.name || "Your profile"}</h2>
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
