"use client";

import Link from "next/link";
import { Compass, Bookmark, FileCheck2, BadgeCheck, UserRound } from "lucide-react";
import { usePathname } from "next/navigation";

const items = [["Discover", "/candidate", Compass], ["Saved", "/candidate/saved-jobs", Bookmark], ["Applications", "/candidate/applications", FileCheck2], ["Proof", "/candidate/proof", BadgeCheck], ["Profile", "/candidate/profile", UserRound]] as const;

export default function BottomNav() {
  const path = usePathname();
  return <nav className="bottom-nav" aria-label="Main navigation">{items.map(([label, href, Icon]) => {
    const active = path === href || (href !== "/candidate" && path.startsWith(href));
    return <Link className={active ? "nav-item active" : "nav-item"} href={href} key={href}><Icon size={18} strokeWidth={active ? 2.5 : 1.8} /><span>{label}</span></Link>;
  })}</nav>;
}
