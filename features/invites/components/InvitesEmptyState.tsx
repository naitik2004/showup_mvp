import Link from "next/link";
import { APP_ROUTES } from "@/lib/navigation";
import styles from "../invites.module.css";
export default function InvitesEmptyState() {
  return (
    <section className={`card emp ${styles.content}`}>
      <h3>No match invites yet</h3>
      <p>When someone invites you to a match, it will appear here.</p>
      <Link className={`btn gh ${styles.browse}`} href={APP_ROUTES.home}>
        Browse matches
      </Link>
    </section>
  );
}
