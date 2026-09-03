"use client";

import {
  BadgeCheck,
  Bookmark,
  Compass,
  FileCheck2,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const HOME_HREF = "/candidate";

const navItems = [
  { label: "Discover", href: HOME_HREF, Icon: Compass },
  { label: "Saved", href: "/candidate/saved-jobs", Icon: Bookmark },
  { label: "Applications", href: "/candidate/applications", Icon: FileCheck2 },
  { label: "Proof", href: "/candidate/proof", Icon: BadgeCheck },
  { label: "Profile", href: "/candidate/profile", Icon: UserRound },
] as const;

export default function BottomNav() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || (href !== HOME_HREF && pathname.startsWith(href));

  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      {navItems.map(({ label, href, Icon }) => {
        const active = isActive(href);

        return (
          <Link
            className={active ? "nav-item active" : "nav-item"}
            href={href}
            key={href}
          >
            <Icon size={18} strokeWidth={active ? 2.5 : 1.8} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
