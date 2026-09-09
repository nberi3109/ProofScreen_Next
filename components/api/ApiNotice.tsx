import { AlertTriangle, PlugZap, ServerCrash } from "lucide-react";

import { API_BASE_URL_ENV, ApiError, ApiNotConfiguredError } from "@/lib/api/client";

/**
 * What a screen shows instead of blowing up when the backend is not there.
 *
 * A dashboard whose only failure mode is a full-page error boundary is
 * unusable in the one situation where it fails most often: the API is not
 * running yet. So the panel names the actual cause and the actual fix, because
 * whoever sees it is the person who can fix it.
 */
export default function ApiNotice({
  error,
  what,
}: {
  error: ApiError | ApiNotConfiguredError;
  what: string;
}) {
  if (error instanceof ApiNotConfiguredError) {
    return (
      <div className="api-notice api-notice-config">
        <PlugZap size={18} />
        <div>
          <b>The frontend does not know where the API is.</b>
          <p>
            {API_BASE_URL_ENV} is unset. Copy <code>.env.example</code> to{" "}
            <code>.env.local</code> and point it at the running ProofScreen API.
          </p>
        </div>
      </div>
    );
  }

  if (error.isUnreachable) {
    return (
      <div className="api-notice api-notice-down">
        <ServerCrash size={18} />
        <div>
          <b>The ProofScreen API is not responding.</b>
          <p>
            Could not load {what} — {error.detail}. Start the backend
            (<code>uvicorn api.main:app --reload</code> or{" "}
            <code>docker compose up</code>) and reload this page.
          </p>
        </div>
      </div>
    );
  }

  if (error.isOriginDown) {
    return (
      <div className="api-notice api-notice-down">
        <ServerCrash size={18} />
        <div>
          <b>The API server is not answering.</b>
          <p>
            Could not load {what}. The CDN in front of the API reached it and
            got no reply ({error.status}) — so the API process is down, or is
            not listening on the port the CDN connects to. Nothing reached the
            application, so this is not a bad request.
          </p>
        </div>
      </div>
    );
  }

  if (error.isNotFound) {
    return (
      <div className="api-notice">
        <AlertTriangle size={18} />
        <div>
          <b>Not found.</b>
          <p>The API has no record of {what}.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="api-notice">
      <AlertTriangle size={18} />
      <div>
        <b>Could not load {what}.</b>
        <p>
          The API replied {error.status}: {error.detail}
        </p>
      </div>
    </div>
  );
}

/** The "nothing here yet" case, which is not an error and must not look like
 *  one — an empty dashboard on a fresh database is the expected first state. */
export function EmptyNotice({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="api-notice api-notice-empty">
      <div>
        <b>{title}</b>
        {children}
      </div>
    </div>
  );
}
