"use client";

import { SlidersHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import type { RoleOut } from "@/lib/api/types";

/**
 * The role lens. Switching it re-ranks the SAME stored evidence under a
 * different recruiter's priorities — no candidate is re-interviewed and no
 * model call is made, because every answer's signals were persisted verbatim.
 *
 * The current role arrives as a prop rather than from `useSearchParams()`, on
 * purpose: reading search params in a Client Component opts the whole subtree
 * into dynamic rendering behind a Suspense boundary. The page already has the
 * value from its own `searchParams`, so passing it down keeps this component a
 * plain controlled select.
 */
export default function RoleLens({
  roles,
  activeRoleId,
  basePath,
}: {
  roles: RoleOut[];
  activeRoleId: string;
  basePath: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function choose(value: string) {
    startTransition(() => {
      router.push(value ? `${basePath}?role_id=${encodeURIComponent(value)}` : basePath);
    });
  }

  return (
    <label className={`role-lens ${pending ? "is-pending" : ""}`}>
      <SlidersHorizontal size={14} />
      <span>Rank for</span>
      <select
        value={activeRoleId}
        onChange={(event) => choose(event.target.value)}
        disabled={pending}
      >
        <option value="">Job-family defaults</option>
        {roles.map((role) => (
          <option value={role.id} key={role.id}>
            {role.title}
            {role.is_default ? " (default)" : ""} · {role.job_family_label || role.job_family}
          </option>
        ))}
      </select>
      {pending && <em>re-ranking…</em>}
    </label>
  );
}
