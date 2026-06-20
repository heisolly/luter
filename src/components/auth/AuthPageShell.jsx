import React from 'react';
import { Link } from 'react-router-dom';
import WallOfLove from '../../pages/WallOfLove';

export default function AuthPageShell({
  type = 'signin',
  title,
  subtitle,
  children,
  footer,
  bottomNote,
  error,
  onModeChange
}) {
  const isSignIn = type === 'signin';

  const handleModeClick = (nextType, path) => (event) => {
    if (nextType === type) return;
    event.preventDefault();
    onModeChange?.(nextType, path);
  };

  return (
    <div className="auth-simple-page">
      <div className="auth-love-background" aria-hidden="true">
        <WallOfLove transparentBg />
      </div>

      <main className="auth-simple-main">
        <section className="auth-simple-card" aria-label={isSignIn ? 'Sign in form' : 'Sign up form'}>
          <Link to="/" className="auth-simple-logo-link" aria-label="Go to Luter home">
            <img src="/Header logo.png" alt="Luter" className="auth-simple-logo" />
          </Link>

          <div className="auth-simple-copy">
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>

          <div className={`auth-mode-switch ${type === 'signin' ? 'is-signin' : 'is-signup'}`} aria-label="Authentication mode">
            <Link className={type === 'signup' ? 'is-active' : ''} to="/signup" onClick={handleModeClick('signup', '/signup')}>Sign up</Link>
            <Link className={type === 'signin' ? 'is-active' : ''} to="/signin" onClick={handleModeClick('signin', '/signin')}>Sign in</Link>
          </div>

          {error && (
            <div className="auth-alert" role="alert">
              {error}
            </div>
          )}

          <div className="auth-switch-panel" key={type}>
            {children}
            {footer && <div className="auth-footer-link">{footer}</div>}
            {bottomNote && <div className="auth-bottom-note">{bottomNote}</div>}
          </div>
        </section>
      </main>

      <style>{`
        .auth-simple-page {
          min-height: 100vh;
          min-height: 100dvh;
          position: relative;
          overflow-x: clip;
          overflow-y: auto;
          background:
            radial-gradient(circle at 12% 18%, rgba(196, 181, 253, 0.24) 0%, transparent 30%),
            radial-gradient(circle at 88% 82%, rgba(152, 255, 152, 0.22) 0%, transparent 32%),
            #F9FAFB;
          color: #333333;
          font-family: var(--font-body);
        }

        .auth-love-background {
          position: fixed;
          inset: -7vh -10vw;
          z-index: 0;
          opacity: 0.92;
          /* translateZ(0) promotes this container to its own GPU layer so the
             inner CSS animations don't have to composite against the page */
          transform: rotate(-3deg) scale(1.1) translateZ(0);
          -webkit-transform: rotate(-3deg) scale(1.1) translateZ(0);
          filter: saturate(1.04);
          pointer-events: none;
          will-change: transform;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          overflow: hidden;
        }

        .auth-love-background section {
          min-height: 116vh !important;
          padding: 12px 0 !important;
          justify-content: center !important;
        }

        .auth-love-background .wol-card {
          box-shadow: 0 18px 48px rgba(51, 51, 51, 0.12) !important;
        }

        .auth-simple-page::after {
          content: '';
          position: fixed;
          inset: 0;
          z-index: 1;
          pointer-events: none;
          background:
            linear-gradient(90deg, rgba(249, 250, 251, 0.24), rgba(249, 250, 251, 0.08), rgba(249, 250, 251, 0.24)),
            radial-gradient(circle at center, rgba(249, 250, 251, 0.58) 0%, rgba(249, 250, 251, 0.22) 48%, rgba(249, 250, 251, 0.08) 100%);
        }

        .auth-simple-main {
          min-height: 100vh;
          min-height: 100dvh;
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: max(24px, env(safe-area-inset-top)) 20px max(24px, env(safe-area-inset-bottom));
          box-sizing: border-box;
        }

        .auth-simple-card {
          width: min(100%, 522px);
          max-height: calc(100vh - 48px);
          max-height: calc(100dvh - 48px);
          overflow-y: auto;
          overscroll-behavior: contain;
          background:
            linear-gradient(180deg, rgba(249, 250, 251, 0.94), rgba(249, 250, 251, 0.9)),
            radial-gradient(circle at 0% 0%, rgba(255, 210, 166, 0.2), transparent 36%),
            radial-gradient(circle at 100% 100%, rgba(196, 181, 253, 0.24), transparent 42%);
          border: 1px solid rgba(196, 181, 253, 0.72);
          border-radius: 28px;
          box-shadow: 0 30px 90px rgba(51, 51, 51, 0.14);
          backdrop-filter: blur(18px);
          padding: 32px 28px 28px;
          text-align: center;
          box-sizing: border-box;
        }

        .auth-simple-logo-link {
          display: inline-flex;
          align-self: center;
          margin-bottom: 18px;
        }

        .auth-simple-logo {
          height: 42px;
          width: auto;
          display: block;
        }

        .auth-simple-copy h1 {
          margin: 0;
          color: #333333;
          font-family: var(--font-display);
          font-size: clamp(2rem, 5vw, 2.65rem);
          line-height: 1.05;
          letter-spacing: -0.035em;
          font-weight: 900;
        }

        .auth-simple-copy p {
          margin: 12px auto 0;
          max-width: 400px;
          color: rgba(51, 51, 51, 0.72);
          font-size: 15px;
          line-height: 1.55;
          font-weight: 700;
        }

        .auth-mode-switch {
          position: relative;
          width: min(100%, 220px);
          height: 52px;
          margin: 26px auto 26px;
          border: 1px solid rgba(196, 181, 253, 0.76);
          border-radius: 999px;
          background: rgba(249, 250, 251, 0.78);
          padding: 4px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4px;
          box-shadow: inset 0 1px 4px rgba(51, 51, 51, 0.05);
          overflow: hidden;
        }

        .auth-mode-switch::before {
          content: '';
          position: absolute;
          top: 4px;
          bottom: 4px;
          left: 4px;
          width: calc(50% - 6px);
          border-radius: 999px;
          background: #C4B5FD;
          box-shadow: 0 8px 18px rgba(196, 181, 253, 0.35);
          transition: transform 0.24s cubic-bezier(0.2, 0.8, 0.2, 1);
        }

        .auth-mode-switch.is-signin::before {
          transform: translateX(calc(100% + 4px));
        }

        .auth-mode-switch a {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          color: rgba(51, 51, 51, 0.72);
          font-family: var(--font-display);
          font-size: 14px;
          font-weight: 800;
          text-decoration: none;
          transition: color 0.18s ease, transform 0.18s ease;
        }

        .auth-mode-switch a.is-active {
          color: #333333;
          transform: translateY(-1px);
        }

        .auth-switch-panel {
          animation: auth-panel-in 0.22s ease both;
        }

        @keyframes auth-panel-in {
          from {
            opacity: 0;
            transform: translateY(8px) scale(0.992);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .auth-alert {
          background: #FEF2F2;
          color: #B91C1C;
          padding: 13px 14px;
          border-radius: 14px;
          font-size: 14px;
          font-weight: 700;
          margin-bottom: 16px;
          border: 1px solid #FCA5A5;
          text-align: left;
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .auth-input-wrap {
          position: relative;
          display: block;
        }

        .auth-input-wrap svg {
          position: absolute;
          left: 18px;
          top: 50%;
          transform: translateY(-50%);
          color: #C4B5FD;
          font-size: 18px;
          pointer-events: none;
        }

        .auth-input {
          width: 100%;
          min-height: 54px;
          border-radius: 999px;
          border: 1px solid rgba(196, 181, 253, 0.62);
          background: rgba(249, 250, 251, 0.9);
          color: #333333;
          padding: 0 18px 0 48px;
          font-size: 15px;
          font-weight: 700;
          font-family: var(--font-body);
          outline: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
          box-sizing: border-box;
          text-transform: none;
        }

        .auth-input::placeholder {
          color: rgba(51, 51, 51, 0.5);
        }

        .auth-input:focus {
          border-color: #C4B5FD;
          box-shadow: 0 0 0 4px rgba(196, 181, 253, 0.28);
        }

        .auth-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 16px 0;
          color: rgba(51, 51, 51, 0.68);
          font-family: var(--font-display);
          font-size: 13px;
          font-weight: 800;
        }

        .auth-divider::before,
        .auth-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: rgba(196, 181, 253, 0.5);
        }

        .auth-divider span {
          white-space: nowrap;
        }

        .auth-submit {
          margin-top: 10px;
        }

        .auth-footer-link {
          margin-top: 18px;
          color: rgba(51, 51, 51, 0.68);
          font-size: 14px;
          font-weight: 700;
        }

        .auth-footer-link a,
        .auth-inline-switch,
        .auth-bottom-note a {
          color: #333333;
          font-weight: 900;
          text-decoration: underline;
          text-decoration-color: #C4B5FD;
          text-decoration-thickness: 2px;
          text-underline-offset: 3px;
        }

        .auth-footer-link a:hover,
        .auth-inline-switch:hover,
        .auth-bottom-note a:hover {
          text-decoration: underline;
        }

        .auth-inline-switch {
          appearance: none;
          background: none;
          border: 0;
          padding: 0;
          cursor: pointer;
          font-family: inherit;
          font-size: inherit;
        }

        .auth-bottom-note {
          margin-top: 20px;
          color: rgba(51, 51, 51, 0.55);
          font-size: 12px;
          font-weight: 700;
          line-height: 1.55;
        }

        .auth-success-card {
          text-align: center;
        }

        .auth-success-icon {
          width: 72px;
          height: 72px;
          border-radius: 22px;
          background: #98FF98;
          color: #333333;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 38px;
          margin-bottom: 22px;
        }

        .auth-success-card h2 {
          margin: 0 0 12px;
          color: #333333;
          font-family: var(--font-display);
          font-size: 32px;
          line-height: 1;
          letter-spacing: -0.03em;
          font-weight: 900;
        }

        .auth-success-card p {
          margin: 0 0 26px;
          color: rgba(51, 51, 51, 0.72);
          font-size: 15px;
          line-height: 1.65;
          font-weight: 700;
        }

        .auth-success-card strong {
          color: #333333;
          overflow-wrap: anywhere;
        }

        @media (max-width: 900px) {
          .auth-love-background {
            inset: -8vh -55vw;
            opacity: 0.72;
            transform: rotate(-4deg) scale(1) translateZ(0);
            -webkit-transform: rotate(-4deg) scale(1) translateZ(0);
          }

          .auth-simple-main {
            padding-left: 16px;
            padding-right: 16px;
          }

          .auth-simple-card {
            width: min(100%, 500px);
            padding: 30px 24px 26px;
            border-radius: 26px;
          }
        }

        @media (max-width: 640px) {
          .auth-simple-page {
            overflow-y: auto;
          }

          .auth-love-background {
            inset: -5vh -190vw;
            opacity: 0.5;
            transform: rotate(-5deg) scale(0.88) translateZ(0);
            -webkit-transform: rotate(-5deg) scale(0.88) translateZ(0);
          }

          .auth-simple-main {
            align-items: center;
            min-height: 100svh;
            padding: max(14px, env(safe-area-inset-top)) 12px max(24px, env(safe-area-inset-bottom));
          }

          .auth-simple-card {
            max-height: calc(100svh - 38px);
            min-height: auto;
            overflow-y: auto;
            padding: 24px 18px;
            border-radius: 20px;
          }

          .auth-simple-logo {
            height: 36px;
          }

          .auth-simple-copy h1 {
            font-size: clamp(1.8rem, 8vw, 2.15rem);
            line-height: 1.08;
            letter-spacing: -0.025em;
          }

          .auth-simple-copy p {
            font-size: 14px;
            line-height: 1.48;
            max-width: 32rem;
          }

          .auth-mode-switch {
            margin: 22px auto;
          }

          .auth-input {
            min-height: 52px;
            font-size: 14px;
          }

          .auth-success-icon {
            width: 64px;
            height: 64px;
            border-radius: 18px;
            font-size: 34px;
          }

          .auth-success-card h2 {
            font-size: 28px;
          }
        }

        @media (max-width: 420px) {
          .auth-simple-main {
            padding-left: 10px;
            padding-right: 10px;
          }

          .auth-simple-card {
            padding: 22px 14px;
            border-radius: 18px;
          }

          .auth-simple-logo-link {
            margin-bottom: 14px;
          }

          .auth-simple-logo {
            height: 32px;
          }

          .auth-mode-switch {
            width: min(100%, 204px);
            height: 48px;
            margin: 18px auto;
          }

          .auth-form {
            gap: 10px;
          }

          .auth-input-wrap svg {
            left: 16px;
            font-size: 17px;
          }

          .auth-input {
            min-height: 50px;
            padding-left: 44px;
          }

          .auth-divider {
            margin: 13px 0;
          }

          .auth-footer-link {
            margin-top: 14px;
            font-size: 13px;
            line-height: 1.45;
          }

          .auth-bottom-note {
            margin-top: 14px;
            font-size: 11.5px;
          }
        }

        @media (max-width: 340px) {
          .auth-simple-card {
            padding-left: 12px;
            padding-right: 12px;
          }

          .auth-simple-copy h1 {
            font-size: 1.72rem;
          }

          .auth-simple-copy p {
            font-size: 13px;
          }

          .auth-mode-switch {
            width: 190px;
          }
        }
      `}</style>
    </div>
  );
}
