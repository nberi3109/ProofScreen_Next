import Image from "next/image";
import Link from "next/link";

export default function CandidateLogin() {
  return (
    <main className="auth-page">
      <div className="auth-card">
        <Link href="/candidate" className="brand">
          <Image
            src="/evident-logo.png"
            alt="Evident"
            width={970}
            height={302}
            className="brand-logo"
            priority
          />
        </Link>
        <span className="eyebrow">CANDIDATE SPACE</span>
        <h1>Turn your experience into proof.</h1>
        <p>Find roles that fit and show employers what you can do.</p>
        <input placeholder="Email address" type="email" />
        <button className="primary-button">Continue</button>
        <small>By continuing, you agree to our terms.</small>
      </div>
    </main>
  );
}
