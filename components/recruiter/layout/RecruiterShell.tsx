"use client";

import {
  Bell,
  Bookmark,
  BriefcaseBusiness,
  ChevronDown,
  Layers3,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";

const navItems = [
  { label: "Find Candidates", href: "/recruiter/candidates", Icon: Users },
  { label: "Jobs", href: "/recruiter/jobs", Icon: BriefcaseBusiness },
  { label: "Talent Pools", href: "/recruiter/talent-pools", Icon: Layers3 },
  {
    label: "Saved Searches",
    href: "/recruiter/saved-searches",
    Icon: Bookmark,
  },
] as const;

export default function RecruiterShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [immediateJoiners, setImmediateJoiners] = useState(false);

  // The immediate-joiners tab depends on the URL query, which is only readable in the
  // browser. Reading it after mount keeps every recruiter page statically rendered;
  // useSearchParams() would force a Suspense boundary around the whole shell.
  useEffect(() => {
    const availability = new URLSearchParams(window.location.search).get(
      "availability",
    );
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setImmediateJoiners(
      pathname === "/recruiter/candidates" && availability === "now",
    );
  }, [pathname]);

  const onCandidates = pathname.startsWith("/recruiter/candidates");

  return (
    <div className="recruiter-shell">
      <div className="recruiter-content">
        <header className="recruiter-topbar">
          <Link href="/recruiter" className="brand">
            Skills<span>Proof</span>
          </Link>

          <nav className="recruiter-main-nav">
            {navItems.map(({ label, href }) => (
              <Link
                href={href}
                className={pathname.startsWith(href) ? "active" : ""}
                key={href}
              >
                {label}
              </Link>
            ))}
          </nav>

          <div className="recruiter-top-actions">
            <Bell size={17} />
            <span className="avatar recruiter-avatar">PS</span>
            <span className="recruiter-user">
              Priya Verma<small>Recruiter</small>
            </span>
            <ChevronDown size={13} />
          </div>
        </header>

        <div className="recruiter-subnav">
          <Link
            href="/recruiter/candidates"
            className={onCandidates && !immediateJoiners ? "active" : ""}
          >
            Advanced Search
          </Link>
          <Link
            href="/recruiter/saved-searches"
            className={
              pathname.startsWith("/recruiter/saved-searches") ? "active" : ""
            }
          >
            Manage Searches
          </Link>
          <Link
            href="/recruiter/candidates?availability=now"
            className={immediateJoiners ? "active" : ""}
          >
            Immediate Joiners
          </Link>
        </div>

        {children}
      </div>
    </div>
  );
}
