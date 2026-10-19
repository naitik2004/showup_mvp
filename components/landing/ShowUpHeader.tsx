"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useNavigationSummary } from "@/features/navigation/hooks/useNavigationSummary";
import { APP_ROUTES } from "@/lib/navigation";

export default function ShowUpHeader() {
  const pathname = usePathname();
  const { authenticated, friendRequests, invites } = useNavigationSummary();

  const active = (href: string) => pathname === href;
  const hostHref = authenticated ? "/groups/create" : "/login";

  return (
    <>
      <svg width="0" height="0" aria-hidden="true" className="su-symbol">
        <symbol id="showup-ball" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="47"
            fill="#d8f03c"
            stroke="#15130f"
            strokeWidth="4"
          />
          <path
            d="M13 22C35 40 35 60 13 78M87 22C65 40 65 60 87 78"
            fill="none"
            stroke="#fff"
            strokeWidth="6"
            strokeLinecap="round"
          />
        </symbol>
        <symbol id="showup-basketball" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="47"
            fill="#db762e"
            stroke="#15130f"
            strokeWidth="4"
          />
          <path
            d="M50 4C33 20 33 80 50 96M50 4C67 20 67 80 50 96M5 34C28 47 72 47 95 34M5 66C28 53 72 53 95 66"
            fill="none"
            stroke="#15130f"
            strokeWidth="4"
          />
        </symbol>
      </svg>
      <header className="bar app-header">
        <div className="wrap">
          <Link
            className="logo"
            href={APP_ROUTES.home}
            aria-label="ShowUp home"
          >
            SH
            <span className="ow showup-logo-ball">
              <svg>
                <use href="#showup-ball" />
              </svg>
            </span>
            W&nbsp;UP<sup>BETA</sup>
          </Link>
          <nav id="nv" aria-label="Main navigation">
            {(["home", "friends", "invites", "profile"] as const).map(
              (section) => (
                <Link
                  key={section}
                  className={active(APP_ROUTES[section]) ? "on" : ""}
                  href={APP_ROUTES[section]}
                >
                  {section[0].toUpperCase() + section.slice(1)}
                  {section === "friends" && friendRequests > 0 && <b aria-label={`${friendRequests} received friend requests`}>{friendRequests}</b>}
                  {section === "invites" && invites > 0 && <b aria-label={`${invites} pending invites`}>{invites}</b>}
                </Link>
              ),
            )}
          </nav>
          <Link className="btn" href={hostHref}>
            {authenticated ? "+ Host a game" : "Sign in"}
          </Link>
        </div>
      </header>
    </>
  );
}
