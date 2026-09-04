import { Bell } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import BottomNav from "@/components/candidate/layout/BottomNav";

const navLinks = [
  { label: "Discover", href: "/candidate" },
  { label: "Saved", href: "/candidate/saved-jobs" },
  { label: "Applications", href: "/candidate/applications" },
  { label: "Get verified", href: "/candidate/start" },
  { label: "Proof score", href: "/candidate/proof" },
  { label: "Profile", href: "/candidate/profile" },
] as const;

export default function CandidateShell({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <header className="topbar">
        <Link href="/candidate" className="brand">
          Skills<span>Proof</span>
        </Link>

        <nav className="desktop-nav">
          {navLinks.map(({ label, href }) => (
            <Link href={href} key={href}>
              {label}
            </Link>
          ))}
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Bell size={18} color="#716d82" />
          <Link href="/candidate/profile" className="avatar">
            RS
          </Link>
        </div>
      </header>

      {children}

      <BottomNav />
    </div>
  );
}
