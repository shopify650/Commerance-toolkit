import { useState, useEffect, useCallback, useRef } from "react"
import { framer, isCodeFileComponentExport, useIsAllowedTo } from "@framer/plugin"
import { generateCountdownSource } from "../lib/countdownSource"
import { createCodeFileWithDedup } from "../lib/createCodeFile"
import { loadSlice, saveSlice } from "../lib/storage"
import { useProStatus } from "../lib/useProStatus"
import { ProUpsell } from "../components/ProUpsell"

interface CountdownData {
  message: string
  expiredText: string
  targetDate: string
  durationMinutes: number
  mode: "fixed" | "evergreen"
  displayStyle: "bar" | "badge"
  backgroundColor: string
  textColor: string
  borderStyle: string
  borderColor: string
  radius: number
  fontWeight: number
  showDays: boolean
  showHours: boolean
  showMinutes: boolean
  showSeconds: boolean
  padding: number
  fullWidth: boolean
}

const DEFAULTS: CountdownData = {
  message: "Sale ends in",
  expiredText: "Offer expired",
  targetDate: "",
  durationMinutes: 60,
  mode: "fixed",
  displayStyle: "bar",
  backgroundColor: "#0f172a",
  textColor: "#ffffff",
  borderStyle: "none",
  borderColor: "#e2e8f0",
  radius: 8,
  fontWeight: 600,
  showDays: true,
  showHours: true,
  showMinutes: true,
  showSeconds: true,
  padding: 16,
  fullWidth: false,
}

function getDefaultTargetDate(): string {
  const d = new Date()
  d.setDate(d.getDate() + 7)
  return d.toISOString().slice(0, 16)
}

function pad(n: number): string {
  return String(Math.max(0, n)).padStart(2, "0")
}

export default function CountdownTab() {
  const pro = useProStatus()
  const canCreateCodeFile = useIsAllowedTo("createCodeFile")
  const canAddComponent = useIsAllowedTo("addComponentInstance")
  const isAllowed = canCreateCodeFile && canAddComponent
  const [opts, setOpts] = useState<CountdownData>({
    ...DEFAULTS,
    targetDate: getDefaultTargetDate(),
  })
  const [busy, setBusy] = useState(false)
  const [banner, setBanner] = useState<{ type: "error" | "success"; msg: string } | null>(null)
  const [now, setNow] = useState(Date.now())
  const tickRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)
  const evergreenStartRef = useRef(Date.now())
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    const saved = loadSlice<CountdownData>("countdown")
    if (saved) {
      setOpts((prev) => ({
        ...prev,
        ...saved,
        targetDate: saved.targetDate || prev.targetDate,
      }))
    }
  }, [])

  useEffect(() => {
    tickRef.current = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(tickRef.current)
  }, [])

  const update = useCallback(<K extends keyof CountdownData>(key: K, value: CountdownData[K]) => {
    setOpts((prev) => {
      const next = { ...prev, [key]: value }
      if (key === "durationMinutes") evergreenStartRef.current = Date.now()
      if (key === "mode" && value === "evergreen") evergreenStartRef.current = Date.now()
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => {
        saveSlice("countdown", next, (msg) => setBanner({ type: "error", msg }))
      }, 300)
      return next
    })
  }, [])

  const getRemaining = () => {
    if (opts.mode === "evergreen") {
      return Math.max(0, evergreenStartRef.current + opts.durationMinutes * 60 * 1000 - now)
    }
    return Math.max(0, new Date(opts.targetDate).getTime() - now)
  }

  const remaining = getRemaining()
  const totalSec = Math.floor(remaining / 1000)
  const days = Math.floor(totalSec / 86400)
  const hours = Math.floor((totalSec % 86400) / 3600)
  const minutes = Math.floor((totalSec % 3600) / 60)
  const seconds = totalSec % 60

  const previewUnits: Array<{ value: string; label: string; show: boolean }> = [
    { value: pad(days), label: "Days", show: opts.showDays },
    { value: pad(hours), label: "Hrs", show: opts.showHours },
    { value: pad(minutes), label: "Min", show: opts.showMinutes },
    { value: pad(seconds), label: "Sec", show: opts.showSeconds },
  ].filter((u) => u.show)

  const isExpired = remaining <= 0

  const handleInsert = async () => {
    setBusy(true)
    setBanner(null)
    try {
      const instanceId = crypto.randomUUID?.() ?? Date.now().toString(36) + Math.random().toString(36).slice(2, 9)
      const source = generateCountdownSource({ ...opts, instanceId })
      const codeFile = await createCodeFileWithDedup("CountdownTimer.tsx", source)
      const componentExport = codeFile.exports.find((e) => isCodeFileComponentExport(e))
      if (!componentExport || componentExport.type !== "component") throw new Error("Component export not found.")
      await framer.addComponentInstance({ url: componentExport.insertURL })
      setBanner({ type: "success", msg: "Countdown timer inserted onto canvas!" })
    } catch (err) {
      setBanner({ type: "error", msg: `Failed: ${err instanceof Error ? err.message : "Unknown error"}` })
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="card">
        <span className="label-section">Message</span>

        <div className="field">
          <label className="label-field">Label Text</label>
          <input type="text" placeholder="Sale ends in" value={opts.message} onChange={(e) => update("message", e.target.value)} />
        </div>

        <div className="field">
          <label className="label-field">Expired Text</label>
          <input type="text" placeholder="Offer expired" value={opts.expiredText} onChange={(e) => update("expiredText", e.target.value)} />
        </div>
      </div>

      <div className="card">
        <span className="label-section">Timer Mode</span>

        <div className="field">
          <label className="label-field">Mode</label>
          <div style={{ display: "flex", gap: 0, height: 36 }}>
            <button
              className="btn"
              style={{
                flex: 1,
                borderRadius: "6px 0 0 6px",
                background: opts.mode === "fixed" ? "#6366f1" : "#f1f5f9",
                color: opts.mode === "fixed" ? "#fff" : "#64748b",
                border: "1px solid #e2e8f0",
                borderRight: "none",
                fontWeight: 500,
                fontSize: 12,
              }}
              onClick={() => update("mode", "fixed")}
              type="button"
            >
              Fixed Date
            </button>
            <button
              className="btn"
              style={{
                flex: 1,
                borderRadius: "0 6px 6px 0",
                background: opts.mode === "evergreen" ? "#6366f1" : "#f1f5f9",
                color: opts.mode === "evergreen" ? "#fff" : "#64748b",
                border: "1px solid #e2e8f0",
                fontWeight: 500,
                fontSize: 12,
              }}
              onClick={() => {
                if (opts.mode !== "evergreen" && !pro.proUnlocked) {
                  setBanner({ type: "error", msg: "Evergreen mode requires Pro. Unlock for $19." })
                  return
                }
                update("mode", "evergreen")
              }}
              type="button"
            >
              Evergreen
              {!pro.proUnlocked && (
                <span style={{ fontSize: 8, verticalAlign: "super", marginLeft: 2 }}>PRO</span>
              )}
            </button>
          </div>
        </div>

        {opts.mode === "fixed" ? (
          <div className="field">
            <label className="label-field">Target Date & Time</label>
            <input
              type="datetime-local"
              value={opts.targetDate}
              onChange={(e) => update("targetDate", e.target.value)}
              style={{
                width: "100%",
                height: 36,
                padding: "0 10px",
                fontSize: 13,
                fontFamily: "inherit",
                color: "#1e293b",
                background: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: 6,
                outline: "none",
              }}
            />
          </div>
        ) : (
          <div className="field">
            <label className="label-field">Duration (minutes)</label>
            <div className="slider-group">
              <input type="range" min={1} max={43200} value={opts.durationMinutes} onChange={(e) => update("durationMinutes", Number(e.target.value))} />
              <span className="slider-badge">
                {opts.durationMinutes >= 60
                  ? `${Math.floor(opts.durationMinutes / 60)}h ${opts.durationMinutes % 60}m`
                  : `${opts.durationMinutes}m`}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <span className="label-section">Appearance</span>

        <div className="field">
          <label className="label-field">Display Style</label>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="btn"
              style={{
                flex: 1,
                height: 36,
                borderRadius: 6,
                background: opts.displayStyle === "bar" ? "#6366f1" : "#f1f5f9",
                color: opts.displayStyle === "bar" ? "#fff" : "#64748b",
                border: "1px solid #e2e8f0",
                fontWeight: 500,
                fontSize: 12,
              }}
              onClick={() => update("displayStyle", "bar")}
              type="button"
            >
              Bar
            </button>
            <button
              className="btn"
              style={{
                flex: 1,
                height: 36,
                borderRadius: 6,
                background: opts.displayStyle === "badge" ? "#6366f1" : "#f1f5f9",
                color: opts.displayStyle === "badge" ? "#fff" : "#64748b",
                border: "1px solid #e2e8f0",
                fontWeight: 500,
                fontSize: 12,
              }}
              onClick={() => {
                if (opts.displayStyle !== "badge" && !pro.proUnlocked) {
                  setBanner({ type: "error", msg: "Badge style requires Pro. Unlock for $19." })
                  return
                }
                update("displayStyle", "badge")
              }}
              type="button"
            >
              Badge
              {!pro.proUnlocked && (
                <span style={{ fontSize: 8, verticalAlign: "super", marginLeft: 2 }}>PRO</span>
              )}
            </button>
          </div>
        </div>

        <div className="row">
          <div className="field">
            <label className="label-field">Background</label>
            <div className="color-group">
              <div className="color-dot">
                <input type="color" value={opts.backgroundColor} onChange={(e) => update("backgroundColor", e.target.value)} />
              </div>
              <input type="text" value={opts.backgroundColor} onChange={(e) => update("backgroundColor", e.target.value)} />
            </div>
          </div>
          <div className="field">
            <label className="label-field">Text</label>
            <div className="color-group">
              <div className="color-dot">
                <input type="color" value={opts.textColor} onChange={(e) => update("textColor", e.target.value)} />
              </div>
              <input type="text" value={opts.textColor} onChange={(e) => update("textColor", e.target.value)} />
            </div>
          </div>
        </div>

        <div className="row">
          <div className="field">
            <label className="label-field">Border</label>
            <select value={opts.borderStyle} onChange={(e) => update("borderStyle", e.target.value)}>
              <option value="none">None</option>
              <option value="solid">Solid</option>
              <option value="dashed">Dashed</option>
              <option value="dotted">Dotted</option>
            </select>
          </div>
          {opts.borderStyle !== "none" && (
            <div className="field">
              <label className="label-field">Border Color</label>
              <div className="color-group">
                <div className="color-dot">
                  <input type="color" value={opts.borderColor} onChange={(e) => update("borderColor", e.target.value)} />
                </div>
                <input type="text" value={opts.borderColor} onChange={(e) => update("borderColor", e.target.value)} />
              </div>
            </div>
          )}
        </div>

        <div className="row">
          <div className="field">
            <label className="label-field">Radius</label>
            <div className="slider-group">
              <input type="range" min={0} max={40} value={opts.radius} onChange={(e) => update("radius", Number(e.target.value))} />
              <span className="slider-badge">{opts.radius}px</span>
            </div>
          </div>
          <div className="field">
            <label className="label-field">Padding</label>
            <div className="slider-group">
              <input type="range" min={4} max={40} value={opts.padding} onChange={(e) => update("padding", Number(e.target.value))} />
              <span className="slider-badge">{opts.padding}px</span>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="field">
            <label className="label-field">Font Weight</label>
            <select value={opts.fontWeight} onChange={(e) => update("fontWeight", Number(e.target.value))}>
              <option value={400}>Normal</option>
              <option value={500}>Medium</option>
              <option value={600}>Semi Bold</option>
              <option value={700}>Bold</option>
            </select>
          </div>
          <div className="field" style={{ justifyContent: "flex-end" }}>
            <div className="toggle-row" style={{ marginTop: 18 }}>
              <span className="label-field">Full width</span>
              <button
                className={`toggle-track${opts.fullWidth ? " on" : ""}`}
                onClick={() => update("fullWidth", !opts.fullWidth)}
                type="button"
                role="switch"
                aria-checked={opts.fullWidth}
                aria-label="Toggle full width"
              >
                <span className="toggle-knob" />
              </button>
            </div>
          </div>
        </div>

        <span className="label-group">
          Visible Units
          {!pro.proUnlocked && <span style={{ fontSize: 8, marginLeft: 4, color: "#94a3b8" }}>PRO</span>}
        </span>

        {pro.proUnlocked ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {([
            ["showDays", "Days"],
            ["showHours", "Hours"],
            ["showMinutes", "Minutes"],
            ["showSeconds", "Seconds"],
          ] as const).map(([key, label]) => (
            <div key={key} className="toggle-row">
              <span className="label-field">{label}</span>
              <button
                className={`toggle-track${opts[key] ? " on" : ""}`}
                onClick={() => update(key, !opts[key])}
                type="button"
                role="switch"
                aria-checked={opts[key]}
                aria-label={`Toggle ${label}`}
              >
                <span className="toggle-knob" />
              </button>
            </div>
          ))}
        </div>
        ) : (
          <div style={{ fontSize: 12, color: "#64748b", padding: "8px 0" }}>
            All units visible. Upgrade to Pro to hide individual units.
          </div>
        )}
      </div>

      <hr className="divider" />

      <div className="card">
        <span className="label-section">Preview</span>
        <div
          className="preview-card"
          style={{
            backgroundColor: opts.displayStyle !== "badge" ? opts.backgroundColor : "#f8fafc",
            borderRadius: opts.radius,
            border: opts.displayStyle === "badge"
              ? `2px solid ${opts.backgroundColor}`
              : opts.borderStyle !== "none"
                ? `2px solid ${opts.borderColor}`
                : "none",
            padding: opts.padding + "px " + (opts.padding * 1.5) + "px",
            width: "100%",
            boxSizing: "border-box",
            gap: 8,
            flexWrap: "wrap",
            justifyContent: opts.displayStyle === "badge" ? "center" : "flex-start",
            overflow: "hidden",
          }}
        >
          {isExpired ? (
            <span
              style={{
                fontSize: opts.displayStyle === "badge" ? 13 : 14,
                fontWeight: opts.fontWeight,
                color: opts.displayStyle !== "badge" ? opts.textColor : opts.backgroundColor,
                textAlign: "center",
                width: "100%",
              }}
            >
              {opts.expiredText}
            </span>
          ) : (
            <>
              {opts.message && (
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: opts.fontWeight,
                    color: opts.displayStyle !== "badge" ? opts.textColor : opts.backgroundColor,
                    marginRight: 8,
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  {opts.message}
                </span>
              )}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 4,
                  alignItems: "center",
                  justifyContent: opts.displayStyle === "badge" ? "center" : "flex-start",
                  flex: "1 1 auto",
                  minWidth: 0,
                }}
              >
                {previewUnits.map((u, i) => (
                  <div key={u.label} style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
                    {i > 0 && opts.displayStyle !== "bar" && (
                      <span
                        style={{
                          width: 12,
                          textAlign: "center",
                          fontSize: 14,
                          fontWeight: 700,
                          color: opts.displayStyle !== "badge" ? opts.textColor : opts.backgroundColor,
                          opacity: 0.4,
                          paddingBottom: 10,
                        }}
                      >
                        :
                      </span>
                    )}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          minWidth: 36,
                          height: 40,
                          padding: "0 5px",
                          borderRadius: 8,
                          backgroundColor: opts.displayStyle === "bar" ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.06)",
                          color: opts.displayStyle !== "badge" ? opts.textColor : opts.backgroundColor,
                          fontSize: 18,
                          fontWeight: 700,
                          fontVariantNumeric: "tabular-nums",
                          fontFamily: "system-ui, -apple-system, sans-serif",
                        }}
                      >
                        {u.value}
                      </span>
                      {opts.displayStyle !== "bar" && (
                        <span
                          style={{
                            fontSize: 8,
                            fontWeight: 500,
                            textTransform: "uppercase",
                            letterSpacing: "0.06em",
                            opacity: 0.6,
                            marginTop: 3,
                            color: opts.displayStyle !== "badge" ? opts.textColor : opts.backgroundColor,
                          }}
                        >
                          {u.label}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="card">
        {banner && <div className={`banner banner-${banner.type}`}>{banner.msg}</div>}

        {!pro.proUnlocked && (
          <ProUpsell
            feature="Badge style, evergreen mode & unit toggles."
            proUnlocked={pro.proUnlocked}
            verifying={pro.verifying}
            verifyError={pro.verifyError}
            licenseKeyInput={pro.licenseKeyInput}
            onLicenseKeyChange={pro.setLicenseKeyInput}
            onVerify={pro.verifyLicense}
            onLock={pro.lockPro}
            onReset={pro.reset}
            whopProductUrl={pro.whopProductUrl}
            onBanner={(msg) => setBanner({ type: "success", msg })}
          />
        )}

        {!isAllowed && (
          <div className="banner banner-error">
            You need Design permission (create code files &amp; add components) on this project to insert this — ask the project owner to update your access.
          </div>
        )}

        <button className="btn btn-primary" disabled={busy || !isAllowed} onClick={handleInsert}>
          {busy ? "Inserting..." : "Insert Countdown"}
        </button>
      </div>
    </>
  )
}
