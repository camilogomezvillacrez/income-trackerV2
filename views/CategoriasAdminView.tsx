"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ChevronRight, ChevronDown, Plus, Search, X, Check, Trash2 } from "lucide-react";
import { useDashboardStore, useToastStore } from "@/store/dashboardStore";
import CategoryIcon from "@/components/common/CategoryIcon";
import { categoriesOf, groupCategories } from "@/lib/categoryMeta";
import { CATEGORY_COLORS, CATEGORY_EMOJIS, CATEGORY_ICONS } from "@/constants/categoryIcons";
import { DEFAULT_GROUP, GROUPS } from "@/constants/categories";
import type { Category, MovementType, Subcategory } from "@/types";

type DraftSub = Subcategory & { original?: string };
interface Draft {
  id: number | null;
  tipo: MovementType;
  name: string;
  grupo: string;
  icon: string;
  color: string;
  subs: DraftSub[];
}

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");

const toDraft = (c: Category): Draft => ({
  id: c.id, tipo: c.tipo, name: c.name, grupo: c.grupo || DEFAULT_GROUP, icon: c.icon, color: c.color,
  subs: c.subs.map((s) => ({ ...s, original: s.name })),
});

export default function CategoriasAdminView() {
  const { data, setView, refresh } = useDashboardStore();
  const [tipo, setTipo] = useState<MovementType>("gasto");
  const [draft, setDraft] = useState<Draft | null>(null);

  const list = categoriesOf(data, tipo);
  const groups = groupCategories(list);
  // Ids negativos = categorías por defecto mientras llegan las reales del servidor
  const ready = list.length > 0 && list.every((c) => c.id > 0);

  if (draft) {
    return (
      <CategoryEditor
        key={draft.id ?? "new"}
        initial={draft}
        siblings={categoriesOf(data, draft.tipo).filter((c) => c.id !== draft.id)}
        onClose={() => setDraft(null)}
        onSaved={async () => { await refresh(); setDraft(null); }}
      />
    );
  }

  return (
    <div className="catadm">
      <header className="catadm-head">
        <button className="catadm-back" onClick={() => setView("configuracion")} aria-label="Volver a Configuración">
          <ArrowLeft size={20} />
        </button>
        <h2>Categorías</h2>
      </header>

      <div className="mov-seg catadm-seg" role="tablist" aria-label="Tipo de categoría">
        {([["gasto", "Gastos"], ["ingreso", "Ingresos"]] as const).map(([id, label]) => (
          <button key={id} role="tab" aria-selected={tipo === id} className={tipo === id ? "on" : ""} onClick={() => setTipo(id)}>
            {label}
          </button>
        ))}
      </div>

      {groups.map((g) => (
        <div key={g.name || "all"} className="catadm-group">
          {g.name && (
            <div className="catadm-group-head">
              <span className="catadm-group-dot" style={{ background: g.color }} aria-hidden />
              <h3>{g.name}</h3>
            </div>
          )}
          <div className="mov-card">
            {g.categories.map((c) => (
              <button key={`${c.tipo}-${c.name}`} className="catadm-row" disabled={!ready} onClick={() => setDraft(toDraft(c))}>
                <CategoryIcon icon={c.icon} color={c.color} size={40} />
                <span className="catadm-row-text">
                  <span className="catadm-row-name">{c.name}</span>
                  {c.tipo === "gasto" && (
                    <span className="catadm-row-meta">
                      {c.subs.length === 0 ? "Sin subcategorías" : `${c.subs.length} subcategoría${c.subs.length === 1 ? "" : "s"}`}
                    </span>
                  )}
                </span>
                <ChevronRight size={18} className="catadm-chev" />
              </button>
            ))}
          </div>
        </div>
      ))}

      {!ready && <p className="catadm-note">Cargando tus categorías…</p>}

      <button
        className="catadm-primary"
        disabled={!ready}
        onClick={() => setDraft({ id: null, tipo, name: "", grupo: DEFAULT_GROUP, icon: "icon:Tag", color: "#059669", subs: [] })}
      >
        <Plus size={18} /> Nueva categoría
      </button>
    </div>
  );
}

function CategoryEditor({ initial, siblings, onClose, onSaved }: {
  initial: Draft;
  siblings: Category[];
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const toast = useToastStore((s) => s.show);
  const [d, setD] = useState<Draft>(initial);
  const [picker, setPicker] = useState(false);
  const [newSub, setNewSub] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [move, setMove] = useState<{ movements: number; fixed: number; budget: number; options: string[] } | null>(null);
  const [moveTo, setMoveTo] = useState("");
  // Cuántos registros usa cada subcategoría, para avisar antes de quitar una
  const [subUsage, setSubUsage] = useState<Record<string, number>>({});
  // Subcategoría que se está quitando y tiene registros: espera destino
  const [subMove, setSubMove] = useState<DraftSub | null>(null);
  // Destino elegido para cada subcategoría quitada ("" = sin subcategoría)
  const [subMoves, setSubMoves] = useState<Record<string, string>>({});
  const isNew = d.id === null;

  useEffect(() => {
    if (isNew) return;
    let vivo = true;
    fetch(`/api/categories/${d.id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((b) => { if (vivo && b?.usage) setSubUsage(b.usage); })
      .catch(() => {});
    return () => { vivo = false; };
  }, [d.id, isNew]);

  /** Quita una subcategoría. Si tiene registros, primero pregunta a dónde van. */
  function removeSub(i: number) {
    const sub = d.subs[i];
    // Las que acaba de crear en esta pantalla no tienen registros que mover
    if (sub.original && (subUsage[sub.original] ?? 0) > 0) { setSubMove(sub); return; }
    setD({ ...d, subs: d.subs.filter((_, j) => j !== i) });
  }

  /** Confirma el destino y recién ahí la quita de la lista. */
  function confirmSubMove(dest: string) {
    if (!subMove) return;
    setSubMoves({ ...subMoves, [subMove.original as string]: dest });
    setD({ ...d, subs: d.subs.filter((s) => s !== subMove) });
    setSubMove(null);
  }

  function addSub() {
    const name = newSub.trim();
    if (!name) return;
    if (d.subs.some((s) => norm(s.name) === norm(name))) { setError(`"${name}" ya está en la lista`); return; }
    setD({ ...d, subs: [...d.subs, { name, emoji: "" }] });
    setNewSub("");
    setError("");
  }

  function renameSub(i: number) {
    const current = d.subs[i];
    const name = window.prompt("Nuevo nombre de la subcategoría", current.name)?.trim();
    if (!name || name === current.name) return;
    if (d.subs.some((s, j) => j !== i && norm(s.name) === norm(name))) { setError(`"${name}" ya está en la lista`); return; }
    const subs = [...d.subs];
    subs[i] = { ...current, name };
    setD({ ...d, subs });
    setError("");
  }

  async function save() {
    if (!d.name.trim()) { setError("Ponle un nombre a la categoría"); return; }
    setSaving(true);
    setError("");
    const subRenames = Object.fromEntries(
      d.subs.filter((s) => s.original && s.original !== s.name).map((s) => [s.original as string, s.name])
    );
    const res = await fetch(isNew ? "/api/categories" : `/api/categories/${d.id}`, {
      method: isNew ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tipo: d.tipo, name: d.name.trim(), grupo: d.grupo, icon: d.icon, color: d.color,
        subs: d.subs.map(({ name, emoji }) => ({ name, emoji })), subRenames, subMoves,
      }),
    }).catch(() => null);
    setSaving(false);
    if (!res?.ok) {
      const body = await res?.json().catch(() => ({}));
      setError(body?.error ?? "No se pudo guardar. Revisa tu conexión e intenta de nuevo.");
      return;
    }
    toast(isNew ? "✓ Categoría creada" : "✓ Categoría actualizada");
    await onSaved();
  }

  async function remove(target?: string) {
    setSaving(true);
    setError("");
    const res = await fetch(`/api/categories/${d.id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(target ? { moveTo: target } : {}),
    }).catch(() => null);
    setSaving(false);
    const body = await res?.json().catch(() => ({}));
    if (res?.status === 409 && body?.inUse) {
      setMove({ ...body.inUse, options: body.options ?? [] });
      setMoveTo(body.options?.[0] ?? "");
      return;
    }
    if (!res?.ok) { setError(body?.error ?? "No se pudo eliminar"); return; }
    toast("Categoría eliminada");
    await onSaved();
  }

  const usage = move
    ? [
        move.movements > 0 && `${move.movements} movimiento${move.movements === 1 ? "" : "s"}`,
        move.fixed > 0 && `${move.fixed} gasto${move.fixed === 1 ? "" : "s"} fijo${move.fixed === 1 ? "" : "s"}`,
        move.budget > 0 && "un presupuesto",
      ].filter(Boolean).join(", ")
    : "";

  return (
    <div className="catadm">
      <header className="catadm-head">
        <button className="catadm-back" onClick={onClose} aria-label="Volver a Categorías">
          <ArrowLeft size={20} />
        </button>
        <h2>{isNew ? "Nueva categoría" : "Editar categoría"}</h2>
      </header>

      <button className="catadm-preview" onClick={() => setPicker(true)} aria-label="Cambiar ícono y color">
        <CategoryIcon icon={d.icon} color={d.color} size={88} shape="rounded" />
        <span className="catadm-preview-badge"><ChevronDown size={14} /></span>
      </button>

      <section className="catadm-card">
        <label htmlFor="cat-name" className="catadm-label">Nombre</label>
        <input
          id="cat-name"
          className="catadm-input"
          value={d.name}
          maxLength={40}
          onChange={(e) => setD({ ...d, name: e.target.value })}
          placeholder={d.tipo === "gasto" ? "Ej: Mascotas" : "Ej: Bonos"}
        />

        {d.tipo === "gasto" && (
          <>
            <label htmlFor="cat-group" className="catadm-label">
              Grupo <span>· dónde aparece en la lista</span>
            </label>
            <select
              id="cat-group"
              className="catadm-input"
              value={d.grupo}
              onChange={(e) => setD({ ...d, grupo: e.target.value })}
            >
              {GROUPS.map((g) => <option key={g.name} value={g.name}>{g.name}</option>)}
              {!GROUPS.some((g) => g.name === d.grupo) && <option value={d.grupo}>{d.grupo}</option>}
            </select>
          </>
        )}
      </section>

      {d.tipo === "gasto" && (
        <section className="catadm-card">
          <p className="catadm-label">Subcategorías <span>· toca una para renombrarla</span></p>
          {d.subs.length > 0 && (
            <div className="catadm-chips">
              {d.subs.map((s, i) => (
                <span key={`${s.original ?? "nueva"}-${i}`} className="catadm-chip">
                  <button onClick={() => renameSub(i)}>{s.emoji ? `${s.emoji} ` : ""}{s.name}</button>
                  <button onClick={() => removeSub(i)} aria-label={`Quitar ${s.name}`}>
                    <X size={13} />
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="catadm-add">
            <input
              id="cat-new-sub"
              className="catadm-input"
              value={newSub}
              maxLength={40}
              onChange={(e) => setNewSub(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSub(); } }}
              placeholder="Nueva subcategoría"
            />
            <button className="catadm-add-btn" onClick={addSub} aria-label="Agregar subcategoría">
              <Plus size={18} />
            </button>
          </div>
        </section>
      )}

      {error && <p className="catadm-error" role="alert">{error}</p>}

      {move && (
        <section className="catadm-card catadm-move">
          <p><strong>{d.name}</strong> tiene {usage}. Elige a qué categoría pasarlos antes de eliminarla.</p>
          <label htmlFor="cat-move-to" className="catadm-label">Mover a</label>
          <select id="cat-move-to" className="catadm-input" value={moveTo} onChange={(e) => setMoveTo(e.target.value)}>
            {move.options.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
          <div className="catadm-row-btns">
            <button className="catadm-ghost" onClick={() => setMove(null)}>Cancelar</button>
            <button className="catadm-danger" disabled={!moveTo || saving} onClick={() => remove(moveTo)}>
              {saving ? "Moviendo…" : "Mover y eliminar"}
            </button>
          </div>
        </section>
      )}

      {!isNew && !move && siblings.length > 0 && (
        <button
          className="catadm-delete"
          disabled={saving}
          onClick={() => { if (window.confirm(`¿Eliminar la categoría "${d.name}"?`)) remove(); }}
        >
          <Trash2 size={15} /> Eliminar categoría
        </button>
      )}

      <div className="catadm-footer">
        <button className="catadm-primary" onClick={save} disabled={saving || !d.name.trim()}>
          {saving ? "Guardando…" : "Guardar"}
        </button>
      </div>

      {subMove && (
        <SubMoveSheet
          sub={subMove}
          count={subUsage[subMove.original as string] ?? 0}
          options={d.subs.filter((s) => s !== subMove)}
          onCancel={() => setSubMove(null)}
          onConfirm={confirmSubMove}
        />
      )}

      {picker && (
        <IconColorPicker
          icon={d.icon}
          color={d.color}
          onClose={() => setPicker(false)}
          onApply={(icon, color) => { setD({ ...d, icon, color }); setPicker(false); }}
        />
      )}
    </div>
  );
}

/**
 * Quitar una subcategoría que sí tiene registros no puede dejarlos apuntando a
 * una etiqueta que ya no existe: aquí se elige a dónde pasarlos.
 */
function SubMoveSheet({ sub, count, options, onCancel, onConfirm }: {
  sub: DraftSub;
  count: number;
  options: DraftSub[];
  onCancel: () => void;
  onConfirm: (dest: string) => void;
}) {
  const [dest, setDest] = useState("");
  const registros = `${count} ${count === 1 ? "registro" : "registros"}`;

  return (
    <div className="catpk-overlay" onClick={onCancel}>
      <div
        className="catpk submv entrada"
        role="dialog"
        aria-modal="true"
        aria-label={`Quitar la subcategoría ${sub.name}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="submv-head">
          <h3>¿Y estos {count === 1 ? "gasto" : "gastos"}?</h3>
          <p>
            {registros} {count === 1 ? "usa" : "usan"} <strong>{sub.emoji ? `${sub.emoji} ` : ""}{sub.name}</strong>.
            Si la quitas se quedan sin subcategoría, o los pasas a otra.
          </p>
        </div>

        <div className="submv-body">
          {options.map((o) => (
            <button
              key={o.name}
              className={dest === o.name ? "submv-opt on" : "submv-opt"}
              aria-pressed={dest === o.name}
              onClick={() => setDest(o.name)}
            >
              <span className="submv-opt-emoji">{o.emoji || "📌"}</span>
              <span className="submv-opt-name">{o.name}</span>
              {dest === o.name && <Check size={17} />}
            </button>
          ))}

          <button
            className={dest === "" ? "submv-opt submv-none on" : "submv-opt submv-none"}
            aria-pressed={dest === ""}
            onClick={() => setDest("")}
          >
            <span className="submv-opt-emoji">—</span>
            <span className="submv-opt-name">Dejarlos sin subcategoría</span>
            {dest === "" && <Check size={17} />}
          </button>
        </div>

        <div className="catpk-foot">
          <button className="catpk-cancel" onClick={onCancel}>Cancelar</button>
          <button className={dest ? "catpk-apply" : "catpk-apply submv-go"} onClick={() => onConfirm(dest)}>
            {dest ? `Pasar a ${dest}` : "Quitar"}
          </button>
        </div>
      </div>
    </div>
  );
}

type PickerTab = "icon" | "emoji" | "color";

function IconColorPicker({ icon, color, onApply, onClose }: {
  icon: string;
  color: string;
  onApply: (icon: string, color: string) => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<PickerTab>(icon.startsWith("emoji:") ? "emoji" : "icon");
  const [selIcon, setSelIcon] = useState(icon);
  const [selColor, setSelColor] = useState(color);
  const [query, setQuery] = useState("");
  const [custom, setCustom] = useState("");

  const icons = useMemo(() => {
    const q = norm(query.trim());
    return Object.entries(CATEGORY_ICONS).filter(([name, { tags }]) => !q || norm(`${name} ${tags}`).includes(q));
  }, [query]);

  function applyCustomEmoji() {
    const text = custom.trim();
    if (!text) return;
    // Primer "carácter visible" completo (los emoji con piel o familia son varios code points)
    const first = [...new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(text)][0]?.segment;
    if (first) setSelIcon(`emoji:${first}`);
  }

  const tabs: [PickerTab, string][] = [["icon", "Ícono"], ["emoji", "Emoji"], ["color", "Color"]];

  return (
    <div className="catpk-overlay" onClick={onClose}>
      <div
        className="catpk"
        role="dialog"
        aria-modal="true"
        aria-label="Ícono y color de la categoría"
        onClick={(e) => e.stopPropagation()}
        style={{ "--sel": selColor } as React.CSSProperties}
      >
        <div className="catpk-preview">
          <CategoryIcon icon={selIcon} color={selColor} size={72} shape="rounded" />
        </div>

        <div className="catpk-tabs" role="tablist">
          {tabs.map(([id, label]) => (
            <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? "on" : ""} onClick={() => setTab(id)}>
              {label}
            </button>
          ))}
        </div>

        <div className="catpk-body">
          {tab === "icon" && (
            <>
              <label className="catpk-search">
                <Search size={15} aria-hidden />
                <input
                  id="catpk-search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar ícono: comida, carro, casa…"
                  aria-label="Buscar ícono"
                />
              </label>
              <div className="catpk-grid">
                {icons.map(([name, { Icon }]) => {
                  const value = `icon:${name}`;
                  return (
                    <button key={name} className={selIcon === value ? "on" : ""} onClick={() => setSelIcon(value)} aria-label={name}>
                      <Icon size={24} strokeWidth={1.8} />
                    </button>
                  );
                })}
              </div>
              {icons.length === 0 && <p className="catpk-empty">Sin íconos para “{query.trim()}”. Prueba otra palabra.</p>}
            </>
          )}

          {tab === "emoji" && (
            <>
              <div className="catpk-custom">
                <input
                  id="catpk-emoji"
                  value={custom}
                  onChange={(e) => setCustom(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") applyCustomEmoji(); }}
                  placeholder="Escribe o pega un emoji"
                  aria-label="Emoji personalizado"
                />
                <button onClick={applyCustomEmoji}>Usar</button>
              </div>
              <div className="catpk-grid">
                {CATEGORY_EMOJIS.map((e) => {
                  const value = `emoji:${e}`;
                  return (
                    <button key={e} className={selIcon === value ? "on" : ""} onClick={() => setSelIcon(value)} aria-label={`Emoji ${e}`}>
                      <span className="catpk-emoji">{e}</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {tab === "color" && (
            <div className="catpk-colors">
              {CATEGORY_COLORS.map((c) => {
                const on = selColor.toLowerCase() === c.toLowerCase();
                return (
                  <button key={c} style={{ background: c }} aria-label={`Color ${c}`} aria-pressed={on} onClick={() => setSelColor(c)}>
                    {on && <Check size={20} color="#fff" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="catpk-foot">
          <button className="catpk-cancel" onClick={onClose}>Cancelar</button>
          <button className="catpk-apply" onClick={() => onApply(selIcon, selColor)}>Aplicar</button>
        </div>
      </div>
    </div>
  );
}
