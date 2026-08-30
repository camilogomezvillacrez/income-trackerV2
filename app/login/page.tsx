"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/common/Logo";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  /*
   * iOS presenta el panel de Face ID / autorrelleno y el teclado ENCIMA de la
   * pagina, sin encoger el viewport de layout: por eso el campo enfocado queda
   * detras. visualViewport si reporta el alto realmente visible, asi que con el
   * se reserva ese hueco abajo (--overlay) para tener margen de scroll y se
   * sube el campo por encima del panel.
   */
  useEffect(() => {
    const vv = window.visualViewport;
    const root = document.querySelector<HTMLElement>(".auth-screen");
    if (!vv || !root) return;

    let raf = 0;
    const update = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const covered = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
        root.style.setProperty("--overlay", `${covered}px`);

        const el = document.activeElement;
        if (!(el instanceof HTMLInputElement)) return;
        const visibleBottom = vv.offsetTop + vv.height;
        const over = el.getBoundingClientRect().bottom - (visibleBottom - 16);
        if (over > 1) window.scrollBy({ top: over, behavior: "smooth" });
      });
    };

    // Al enfocar, el panel aun se esta abriendo: se repasa cuando ya subio.
    const onFocus = () => { update(); setTimeout(update, 350); };

    // Sin "scroll": el handler desplaza, y escucharlo se pelea con el
    // desplazamiento del usuario. Con resize y focusin basta.
    vv.addEventListener("resize", update);
    window.addEventListener("focusin", onFocus);
    return () => {
      cancelAnimationFrame(raf);
      vv.removeEventListener("resize", update);
      window.removeEventListener("focusin", onFocus);
      root.style.removeProperty("--overlay");
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        router.push("/");
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Error al iniciar sesión");
      }
    } catch {
      setError("No se pudo conectar al servidor. Verifica tu red.");
    }
    setLoading(false);
  }

  return (
    /* .auth-screen: globals.css la exime del bloqueo de scroll movil, para que
       el panel de Face ID / autorrelleno no deje el contenido atrapado arriba. */
    <div className="auth-screen">
      {/* Decoración: capa aparte y fija, así el contenedor no necesita
          overflow:hidden (que es lo que impedía scrollear). */}
      <div aria-hidden className="auth-deco">
        <span style={{ width: "320px", height: "320px", background: "radial-gradient(circle, rgba(74,124,89,0.20), transparent 70%)", top: "-80px", right: "-60px" }} />
        <span style={{ width: "380px", height: "380px", background: "radial-gradient(circle, rgba(74,124,89,0.16), transparent 70%)", bottom: "-120px", left: "-100px" }} />
      </div>

      {/* margin:auto centra pero, a diferencia de justify-content:center,
          no recorta el contenido cuando el viewport se encoge. */}
      <div className="auth-body">
        <header className="auth-header">
          <div className="login-logo">
            <Logo size={168} draw />
          </div>
          <div className="login-title">Mis Finanzas</div>
          <div className="login-sub">Inicia sesión en tu cuenta</div>
        </header>

        <div className="login-card">
          <form onSubmit={handleSubmit}>
            <Field label="Email">
              <input type="email" name="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" style={inputStyle(!!error)} />
            </Field>
            <Field label="Contraseña">
              <input type="password" name="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" style={inputStyle(!!error)} />
            </Field>

            {error && <p style={{ fontSize: "12px", color: "var(--red)", marginBottom: "12px" }}>{error}</p>}

            <button type="submit" disabled={loading} style={btnStyle(loading)}>
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <p style={{ textAlign: "center", fontSize: "12px", color: "var(--muted)", marginTop: "20px" }}>
            ¿No tienes cuenta?{" "}
            <Link href="/register" style={{ color: "#4A7C59", fontWeight: 700, textDecoration: "none" }}>
              Regístrate
            </Link>
          </p>
        </div>
      </div>

      <style>{`
        .auth-screen {
          min-height: 100dvh;
          display: flex;
          flex-direction: column;
          background: linear-gradient(165deg, #DCEBDA 0%, #F4F6F1 45%, #C9DECB 100%);
          padding-top: max(24px, env(safe-area-inset-top));
          padding-inline: 16px;
          /* --overlay = lo que tapa el teclado/panel: reserva sitio para subir. */
          padding-bottom: calc(max(24px, env(safe-area-inset-bottom)) + var(--overlay, 0px));
          transition: padding-bottom 0.2s ease;
          position: relative;
        }
        .auth-deco { position: fixed; inset: 0; overflow: hidden; pointer-events: none; z-index: 0; }
        .auth-deco span { position: absolute; border-radius: 50%; display: block; }

        .auth-body {
          margin: auto;               /* centra sin recortar al encogerse */
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: clamp(18px, 4.5vh, 36px);
          position: relative;
          z-index: 1;
        }
        .auth-header { display: flex; flex-direction: column; align-items: center; text-align: center; }

        .login-logo svg { width: clamp(140px, 42vw, 184px); height: auto; }

        .login-title {
          font-size: clamp(27px, 7.5vw, 33px);
          font-weight: 700;
          color: var(--text);
          margin-top: 14px;
          letter-spacing: -0.02em;
        }
        .login-sub { font-size: 13.5px; color: #4A7C59; font-weight: 500; margin-top: 4px; }

        .login-card {
          background: var(--white);
          border: 1px solid #D8E3D6;
          border-radius: 18px;
          padding: 26px 28px 28px;
          width: 100%;
          max-width: 380px;
          box-shadow: 0 14px 44px rgba(58,94,68,.20);
        }

        /* El árbol se dibuja solo (TreeMark); el resto entra por detrás. */
        .login-title { animation: login-rise 0.5s ease-out 0.50s both; }
        .login-sub   { animation: login-rise 0.5s ease-out 0.62s both; }
        .login-card  { animation: login-rise 0.55s ease-out 0.75s both; }
        @keyframes login-rise {
          0%   { opacity: 0; transform: translateY(14px); }
          100% { opacity: 1; transform: none; }
        }
        @media (prefers-reduced-motion: reduce) {
          .login-title, .login-sub, .login-card { animation: none; }
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "12px" }}>
      <label style={{ display: "block", fontSize: "10px", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "6px" }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle = (hasError: boolean): React.CSSProperties => ({
  width: "100%", background: "var(--bg)", border: `1px solid ${hasError ? "var(--red)" : "var(--border)"}`,
  borderRadius: "8px", padding: "10px 12px", fontSize: "16px", fontFamily: "var(--font-sans)",
  color: "var(--text)", outline: "none",
});

const btnStyle = (loading: boolean): React.CSSProperties => ({
  width: "100%", background: "#4A7C59", color: "#fff", border: "none", borderRadius: "10px",
  padding: "13px", fontSize: "14px", fontWeight: 600, fontFamily: "var(--font-sans)",
  cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, marginTop: "4px",
  boxShadow: "0 5px 16px rgba(74,124,89,.35)",
});
