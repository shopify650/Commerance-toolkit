import { useState, useEffect, useCallback, useRef } from "react"
import { framer, isCodeFileComponentExport, useIsAllowedTo } from "@framer/plugin"
import { generateStripeButtonSource } from "../lib/stripeButtonSource"
import type { StripeButtonOptions } from "../lib/stripeButtonSource"
import { createCodeFileWithDedup } from "../lib/createCodeFile"
import { loadSlice, saveSlice } from "../lib/storage"

const DEFAULTS: StripeButtonOptions = {
  label: "Pay with Stripe",
  paymentLink: "",
  backgroundColor: "#635bff",
  textColor: "#ffffff",
  radius: 8,
  padding: 16,
  fontWeight: 600,
  openInNewTab: true,
  fullWidth: false,
  height: 48,
}

export default function StripeTab() {
  const canCreateCodeFile = useIsAllowedTo("createCodeFile")
  const canAddComponent = useIsAllowedTo("addComponentInstance")
  const isAllowed = canCreateCodeFile && canAddComponent
  const [opts, setOpts] = useState<StripeButtonOptions>(DEFAULTS)
  const [busy, setBusy] = useState(false)
  const [banner, setBanner] = useState<{ type: "error" | "success"; msg: string } | null>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    const saved = loadSlice<StripeButtonOptions>("stripe")
    if (saved) setOpts((prev) => ({ ...prev, ...saved }))
  }, [])

  const update = useCallback(<K extends keyof StripeButtonOptions>(key: K, value: StripeButtonOptions[K]) => {
    setOpts((prev) => {
      const next = { ...prev, [key]: value }
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => {
        saveSlice("stripe", next, (msg) => setBanner({ type: "error", msg }))
      }, 300)
      return next
    })
  }, [])

  const handleInsert = async () => {
    if (!opts.paymentLink.trim()) { setBanner({ type: "error", msg: "Payment link is required." }); return }
    if (!/^https:\/\//.test(opts.paymentLink.trim())) { setBanner({ type: "error", msg: "Payment link must be a valid https:// URL." }); return }

    setBusy(true)
    setBanner(null)
    try {
      const source = generateStripeButtonSource(opts)
      const codeFile = await createCodeFileWithDedup("StripeCheckoutButton.tsx", source)
      const componentExport = codeFile.exports.find((e) => isCodeFileComponentExport(e))
      if (!componentExport || componentExport.type !== "component") throw new Error("Component export not found.")
      await framer.addComponentInstance({ url: componentExport.insertURL })
      setBanner({ type: "success", msg: "Stripe button inserted onto canvas!" })
    } catch (err) {
      setBanner({ type: "error", msg: `Failed: ${err instanceof Error ? err.message : "Unknown error"}` })
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="card">
        <span className="label-section">Configuration</span>

        <div className="field">
          <label className="label-field">Payment Link</label>
          <input type="url" placeholder="https://buy.stripe.com/..." value={opts.paymentLink} onChange={(e) => update("paymentLink", e.target.value)} />
        </div>

        <div className="field">
          <label className="label-field">Button Label</label>
          <input type="text" value={opts.label} onChange={(e) => update("label", e.target.value)} />
        </div>

        <span className="label-group">Colors</span>

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
            <label className="label-field">Text Color</label>
            <div className="color-group">
              <div className="color-dot">
                <input type="color" value={opts.textColor} onChange={(e) => update("textColor", e.target.value)} />
              </div>
              <input type="text" value={opts.textColor} onChange={(e) => update("textColor", e.target.value)} />
            </div>
          </div>
        </div>

        <span className="label-group">Shape</span>

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
              <input type="range" min={8} max={32} value={opts.padding} onChange={(e) => update("padding", Number(e.target.value))} />
              <span className="slider-badge">{opts.padding}px</span>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="field">
            <label className="label-field">Height</label>
            <div className="slider-group">
              <input type="range" min={32} max={80} value={opts.height} onChange={(e) => update("height", Number(e.target.value))} />
              <span className="slider-badge">{opts.height}px</span>
            </div>
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

        <span className="label-group">Style</span>

        <div className="field">
          <label className="label-field">Font Weight</label>
          <select value={opts.fontWeight} onChange={(e) => update("fontWeight", Number(e.target.value))}>
            <option value={400}>Normal</option>
            <option value={500}>Medium</option>
            <option value={600}>Semi Bold</option>
            <option value={700}>Bold</option>
          </select>
        </div>

        <div className="toggle-row">
          <span className="label-field">Open in new tab</span>
          <button
            className={`toggle-track${opts.openInNewTab ? " on" : ""}`}
            onClick={() => update("openInNewTab", !opts.openInNewTab)}
            type="button"
            role="switch"
            aria-checked={opts.openInNewTab}
            aria-label="Toggle open in new tab"
          >
            <span className="toggle-knob" />
          </button>
        </div>
      </div>

      <hr className="divider" />

      <div className="card">
        <span className="label-section">Preview</span>
        <div className="preview-card">
          <button
            style={{
              backgroundColor: opts.backgroundColor,
              color: opts.textColor,
              borderRadius: opts.radius + "px",
              padding: `${opts.padding}px ${opts.padding * 1.5}px`,
              fontWeight: opts.fontWeight,
              border: "none",
              cursor: "default",
              fontSize: 14,
              fontFamily: "inherit",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              minWidth: 140,
              lineHeight: 1,
              width: opts.fullWidth ? "100%" : undefined,
              height: opts.height + "px",
            }}
          >
            {opts.label}
          </button>
        </div>
      </div>

      <div className="card">
        {banner && <div className={`banner banner-${banner.type}`}>{banner.msg}</div>}

        {!isAllowed && (
          <div className="banner banner-error">
            You need Design permission (create code files &amp; add components) on this project to insert this — ask the project owner to update your access.
          </div>
        )}

        <button className="btn btn-primary" disabled={busy || !opts.paymentLink.trim() || !isAllowed} onClick={handleInsert}>
          {busy ? "Inserting..." : "Insert Button"}
        </button>
      </div>
    </>
  )
}
