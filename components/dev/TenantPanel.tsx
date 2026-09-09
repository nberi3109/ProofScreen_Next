"use client";

import { KeyRound, TriangleAlert } from "lucide-react";
import { useActionState } from "react";

import type { ActionResult } from "@/lib/api/actions";
import { provisionTenant } from "@/lib/api/actions";
import type { TenantOut } from "@/lib/api/types";

/**
 * POST /api/dev/tenants — provision a tenant and show its key ONCE.
 *
 * The backend stores only the sha256 of the key, so a key that is not copied
 * out of this response is gone: it is re-provisioned, never recovered. That is
 * the right design and it is also a trap, so the UI's whole job here is to say
 * so loudly BEFORE the reader closes the tab, and to keep the key selectable
 * rather than clever.
 *
 * Deliberately not offered as "regenerate": there is no such endpoint, and a
 * button implying one would promise recovery the system cannot deliver.
 */
export default function TenantPanel() {
  const [state, submit, pending] = useActionState<
    ActionResult<TenantOut> | null,
    FormData
  >(provisionTenant, null);

  return (
    <section className="recruiter-panel tenant-panel">
      <h2>
        <KeyRound size={17} /> Provision a tenant
      </h2>
      <p className="panel-note">
        Creates a tenant and returns its API key. Every row the backend writes
        is scoped to a tenant; requests carry the key in{" "}
        <code>X-API-Key</code>. With <code>REQUIRE_API_KEY=false</code> an
        unkeyed request falls back to the development tenant, which is why a
        demo works without one.
      </p>

      <form action={submit} className="tenant-form">
        <label>
          Slug
          <input
            name="slug"
            placeholder="acme-bpo"
            autoComplete="off"
            pattern="[a-z0-9][a-z0-9-]{1,59}"
            required
          />
        </label>
        <label>
          Name <em>optional</em>
          <input name="name" placeholder="Acme BPO Pvt Ltd" autoComplete="off" />
        </label>
        <button className="primary-button" type="submit" disabled={pending}>
          {pending ? "Provisioning…" : "Provision"}
        </button>
      </form>

      {state && !state.ok && <p className="form-error">{state.error}</p>}

      {state?.ok && (
        <div className="tenant-key">
          <p className="tenant-key-warn">
            <TriangleAlert size={14} /> Copy this key now. Only its hash is
            stored, so it cannot be shown again or recovered — a lost key is
            re-provisioned as a new one.
          </p>
          <b>{state.data.name}</b>
          <small>
            slug <code>{state.data.slug}</code> · id{" "}
            <code>{state.data.id}</code>
          </small>
          {state.data.api_key ? (
            <code className="tenant-key-value">{state.data.api_key}</code>
          ) : (
            <p className="panel-note">
              The response carried no key. That happens when the tenant already
              existed — the existing key is unrecoverable by design.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
