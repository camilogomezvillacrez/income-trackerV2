"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/common/Logo";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

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
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(165deg, #DCEBDA 0%, #F4F6F1 45%, #C9DECB 100%)", padding: "16px", position: "relative", overflow: "hidden" }}>
      {/* Decoración de fondo */}
      <div style={{ position: "absolute", width: "320px", height: "320px", borderRadius: "50%", background: "radial-gradient(circle, rgba(74,124,89,0.20), transparent 70%)", top: "-80px", right: "-60px" }} />
      <div style={{ position: "absolute", width: "380px", height: "380px", borderRadius: "50%", background: "radial-gradient(circle, rgba(74,124,89,0.16), transparent 70%)", bottom: "-120px", left: "-100px" }} />

      <div style={{ background: "var(--white)", border: "1px solid #D8E3D6", borderRadius: "18px", padding: "34px 28px", width: "100%", maxWidth: "380px", boxShadow: "0 14px 44px rgba(58,94,68,.20)", position: "relative" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", marginBottom: "24px" }}>
          <Logo size={96} />
          <div style={{ fontSize: "23px", fontWeight: 700, color: "var(--text)", marginTop: "8px", letterSpacing: "-0.01em" }}>Mis Finanzas</div>
          <div style={{ fontSize: "12.5px", color: "#4A7C59", fontWeight: 500, marginTop: "3px" }}>Inicia sesión en tu cuenta</div>
        </div>

        <form onSubmit={handleSubmit}>
          <Field label="Email">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" autoFocus style={inputStyle(!!error)} />
          </Field>
          <Field label="Contraseña">
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" style={inputStyle(!!error)} />
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
  borderRadius: "8px", padding: "10px 12px", fontSize: "14px", fontFamily: "var(--font-sans)",
  color: "var(--text)", outline: "none",
});

const btnStyle = (loading: boolean): React.CSSProperties => ({
  width: "100%", background: "#4A7C59", color: "#fff", border: "none", borderRadius: "10px",
  padding: "13px", fontSize: "14px", fontWeight: 600, fontFamily: "var(--font-sans)",
  cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, marginTop: "4px",
  boxShadow: "0 5px 16px rgba(74,124,89,.35)",
});
