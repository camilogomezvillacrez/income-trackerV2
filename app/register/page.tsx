"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName]           = useState("");
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [confirm, setConfirm]     = useState("");
  const [inviteToken, setInvite]  = useState("");
  const [error, setError]         = useState("");
  const [loading, setLoading]     = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8) { setError("La contraseña debe tener al menos 8 caracteres"); return; }
    if (password !== confirm)  { setError("Las contraseñas no coinciden"); return; }
    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name, inviteToken }),
    });

    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error ?? "Error al registrarse");
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
            <div style={{ fontSize: "11px", color: "var(--muted)" }}>Crea tu cuenta personal</div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Field label="Token de invitación">
            <input
              type="text"
              value={inviteToken}
              onChange={(e) => setInvite(e.target.value)}
              placeholder="Código que te compartió el administrador"
              style={inp}
            />
          </Field>
          <Field label="Nombre (opcional)">
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre" style={inp} />
          </Field>
          <Field label="Email">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" style={inp} />
          </Field>
          <Field label="Contraseña (mín. 8 caracteres)">
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" style={inp} />
          </Field>
          <Field label="Confirmar contraseña">
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repite la contraseña" style={inp} />
          </Field>

          {error && <p style={{ fontSize: "12px", color: "var(--red)", marginBottom: "12px" }}>{error}</p>}

          <button type="submit" disabled={loading} style={{ width: "100%", background: "var(--text)", color: "#fff", border: "none", borderRadius: "8px", padding: "11px", fontSize: "13px", fontWeight: 500, fontFamily: "var(--font-sans)", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, marginTop: "4px" }}>
            {loading ? "Creando cuenta..." : "Crear cuenta"}
          </button>
        </form>

        <p style={{ textAlign: "center", fontSize: "12px", color: "var(--muted)", marginTop: "20px" }}>
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" style={{ color: "var(--text)", fontWeight: 600, textDecoration: "none" }}>Inicia sesión</Link>
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

const inp: React.CSSProperties = {
  width: "100%", background: "var(--bg)", border: "1px solid var(--border)",
  borderRadius: "8px", padding: "10px 12px", fontSize: "14px",
  fontFamily: "var(--font-sans)", color: "var(--text)", outline: "none",
};
