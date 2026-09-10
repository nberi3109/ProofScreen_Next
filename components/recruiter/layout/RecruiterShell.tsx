"use client";

import {
  Bell,
  ChevronDown,
  FlaskConical,
  Layers3,
  LineChart,
  Stethoscope,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * The recruiter chrome.
 *
 * Navigation lists only screens the backend can actually serve. The mock
 * sub-navigation this replaced ("Advanced Search", "Manage Searches",
 * "Immediate Joiners") pointed at filters Evident stores nothing for —
 * notice period, salary band, availability date — and a live dashboard with
 * dead controls on it is a dashboard nobody trusts twice.
 *
 * `mode` is rendered by the server layout, not fetched here. It says out loud
 * when the model is in fixture mode or WhatsApp is a dry run, because those
 * are exactly the two things a room full of people will otherwise assume are
 * live.
 */
export default function RecruiterShell({
  children,
  mode,
  devEnabled,
}: {
  children: ReactNode;
  mode: { llm: string; whatsapp: string; model: string | null } | null;
  devEnabled: boolean;
}) {
  const pathname = usePathname();

  const navItems = [
    { label: "Candidates", href: "/recruiter/candidates", Icon: Users },
    { label: "Openings", href: "/recruiter/jobs", Icon: Layers3 },
    { label: "Validation", href: "/recruiter/validation", Icon: LineChart },
    ...(devEnabled
      ? [
          { label: "Simulator", href: "/recruiter/simulator", Icon: FlaskConical },
          { label: "Diagnostics", href: "/recruiter/diagnostics", Icon: Stethoscope },
        ]
      : []),
  ];

  const fixture = mode !== null && mode.llm !== "live";
  const dryRun = mode !== null && mode.whatsapp !== "live";

  return (
    <div className="recruiter-shell">
      <div className="recruiter-content">
        <header className="recruiter-topbar">
          <Link href="/recruiter" className="brand">
            <Image
              src="/evident-logo.png"
              alt="Evident"
              width={970}
              height={302}
              className="brand-logo"
              priority
            />
          </Link>

          <nav className="recruiter-main-nav">
            {navItems.map(({ label, href, Icon }) => (
              <Link
                href={href}
                className={pathname.startsWith(href) ? "active" : ""}
                key={href}
              >
                <Icon size={14} /> {label}
              </Link>
            ))}
          </nav>

          <div className="recruiter-top-actions">
            {mode && (fixture || dryRun) && (
              <span
                className="mode-chip"
                title={[
                  fixture
                    ? "LLM fixture mode: claims, questions and signal extraction are deterministic heuristics. Scoring is unchanged."
                    : `Model: ${mode.model ?? "unknown"}`,
                  dryRun
                    ? "WhatsApp dry run: outbound messages are logged, never sent."
                    : "WhatsApp Cloud API live.",
                ].join("\n")}
              >
                <FlaskConical size={12} />
                {fixture ? "Fixture" : "Live model"}
                {dryRun ? " · WA dry run" : ""}
              </span>
            )}
            <Bell size={17} />
            <span className="avatar recruiter-avatar">PS</span>
            <span className="recruiter-user">
              Recruiter<small>Demo account</small>
            </span>
            <ChevronDown size={13} />
          </div>
        </header>

        {children}
      </div>
    </div>
  );
}
