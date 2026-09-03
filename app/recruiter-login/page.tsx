import Link from "next/link";

export default function RecruiterLogin() {
  return (
    <main className="auth-page">
      <div className="auth-card">
        <Link href="/recruiter" className="brand">
          Skills<span>Proof</span>
        </Link>
        <span className="eyebrow">RECRUITER WORKSPACE</span>
        <h1>Find the proof behind the resume.</h1>
        <p>Sign in to discover, evaluate, and hire with stronger evidence.</p>
        <input placeholder="Work email" type="email" />
        <button className="primary-button">Continue</button>
        <small>By continuing, you agree to our terms.</small>
      </div>
    </main>
  );
}
