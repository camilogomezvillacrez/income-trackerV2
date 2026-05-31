"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error ?? "Error al iniciar sesión");
    }
    setLoading(false);
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", padding: "16px" }}>
      <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: "14px", padding: "36px 28px", width: "100%", maxWidth: "380px", boxShadow: "0 4px 24px rgba(0,0,0,.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "28px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "9px", background: "var(--text)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>📊</div>
          <div>
            <div style={{ fontSize: "16px", fontWeight: 600, color: "var(--text)" }}>Mis Finanzas</div>
            <div style={{ fontSize: "11px", color: "var(--muted)" }}>Inicia sesión en tu cuenta</div>
          </div>
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
          <Link href="/register" style={{ color: "var(--text)", fontWeight: 600, textDecoration: "none" }}>
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
  width: "100%", background: "var(--text)", color: "#fff", border: "none", borderRadius: "8px",
  padding: "11px", fontSize: "13px", fontWeight: 500, fontFamily: "var(--font-sans)",
  cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, marginTop: "4px",
});
