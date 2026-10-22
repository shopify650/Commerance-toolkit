import { useState, useEffect, useCallback, useRef } from "react"
import { framer, useIsAllowedTo } from "@framer/plugin"
import QRCode from "qrcode"
import { loadSlice, saveSlice } from "../lib/storage"

interface QROptions {
  content: string
  foreground: string
  background: string
  size: number
  errorCorrection: "L" | "M" | "Q" | "H"
}

const DEFAULTS: QROptions = {
  content: "",
  foreground: "#000000",
  background: "#ffffff",
  size: 256,
  errorCorrection: "M",
}

function svgToDataUrl(svg: string): string {
  try {
    const bytes = new TextEncoder().encode(svg)
    let binary = ""
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return `data:image/svg+xml;base64,${btoa(binary)}`
  } catch {
    return ""
  }
}

export default function QRTab() {
  const isAllowed = useIsAllowedTo("addSVG")
  const [opts, setOpts] = useState<QROptions>(DEFAULTS)
  const [svg, setSvg] = useState<string>("")
  const [busy, setBusy] = useState(false)
  const [banner, setBanner] = useState<{ type: "error" | "success"; msg: string } | null>(null)
  const genTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const svgDataUrl = svg ? svgToDataUrl(svg) : ""

  useEffect(() => {
    const saved = loadSlice<QROptions>("qr")
    if (saved?.content) {
      setOpts((prev) => ({ ...prev, ...saved }))
    } else {
      const stripe = loadSlice<{ paymentLink?: string }>("stripe")
      if (stripe?.paymentLink) setOpts((prev) => ({ ...prev, content: stripe.paymentLink }))
    }
  }, [])

  useEffect(() => {
    if (genTimer.current) clearTimeout(genTimer.current)
    genTimer.current = setTimeout(() => {
      if (!opts.content.trim()) {
        setSvg("")
        return
      }
      QRCode.toString(opts.content.trim(), {
        type: "svg",
        color: { dark: opts.foreground, light: opts.background },
        errorCorrectionLevel: opts.errorCorrection,
        width: Math.min(opts.size, 512),
      })
        .then(setSvg)
        .catch(() => setSvg(""))
    }, 150)
    return () => {
      if (genTimer.current) clearTimeout(genTimer.current)
    }
  }, [opts.content, opts.foreground, opts.background, opts.errorCorrection, opts.size])

  const update = useCallback(<K extends keyof QROptions>(key: K, value: QROptions[K]) => {
    setOpts((prev) => {
      const next = { ...prev, [key]: value }
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => {
        saveSlice("qr", next, (msg) => setBanner({ type: "error", msg }))
      }, 300)
      return next
    })
  }, [])

  const MAX_QR_CHARS = 800
  const isQrTooLong = opts.content.trim().length > MAX_QR_CHARS

  const handleInsert = async () => {
    if (!opts.content.trim()) {
      setBanner({ type: "error", msg: "Content is required." })
      return
    }
    if (isQrTooLong) {
      setBanner({ type: "error", msg: `Content exceeds ${MAX_QR_CHARS} characters — QR will be too dense to scan.` })
      return
    }
    if (!svg) {
      setBanner({ type: "error", msg: "Could not generate QR code. Check content." })
      return
    }

    setBusy(true)
    setBanner(null)
    try {
      const svgString = svg.startsWith("<?xml") ? svg.replace(/^<\?xml[^>]*\?>\s*/i, "") : svg
      await framer.addSVG({ svg: svgString, name: "QR Code" })
      setBanner({ type: "success", msg: "QR Code inserted onto canvas!" })
    } catch (err) {
      setBanner({ type: "error", msg: `Failed: ${err instanceof Error ? err.message : "Unknown error"}` })
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="card">
        <span className="label-section">Content</span>

        <div className="field">
          <label className="label-field">URL or Text</label>
          <textarea
            placeholder="https://example.com or Stripe Payment Link"
            value={opts.content}
            onChange={(e) => update("content", e.target.value)}
            rows={3}
            style={isQrTooLong ? { borderColor: "#ef4444" } : undefined}
          />
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
            <span style={{ fontSize: 11, color: isQrTooLong ? "#ef4444" : "#94a3b8" }}>
              {opts.content.trim().length} / {MAX_QR_CHARS}
            </span>
          </div>
        </div>

        <span className="label-group">Colors</span>

        <div className="row">
          <div className="field">
            <label className="label-field">Foreground</label>
            <div className="color-group">
              <div className="color-dot">
                <input type="color" value={opts.foreground} onChange={(e) => update("foreground", e.target.value)} />
              </div>
              <input type="text" value={opts.foreground} onChange={(e) => update("foreground", e.target.value)} />
            </div>
          </div>
          <div className="field">
            <label className="label-field">Background</label>
            <div className="color-group">
              <div className="color-dot">
                <input type="color" value={opts.background} onChange={(e) => update("background", e.target.value)} />
              </div>
              <input type="text" value={opts.background} onChange={(e) => update("background", e.target.value)} />
            </div>
          </div>
        </div>

        <span className="label-group">Settings</span>

        <div className="row">
          <div className="field">
            <label className="label-field">Size</label>
            <div className="slider-group">
              <input type="range" min={128} max={512} value={opts.size} onChange={(e) => update("size", Number(e.target.value))} />
              <span className="slider-badge">{opts.size}px</span>
            </div>
          </div>
          <div className="field">
            <label className="label-field">Correction</label>
            <select value={opts.errorCorrection} onChange={(e) => update("errorCorrection", e.target.value as QROptions["errorCorrection"])}>
              <option value="L">Low</option>
              <option value="M">Medium</option>
              <option value="Q">Quartile</option>
              <option value="H">High</option>
            </select>
          </div>
        </div>
      </div>

      <hr className="divider" />

      <div className="card">
        <span className="label-section">Preview</span>
        <div className="preview-card">
          {svgDataUrl ? (
            <img src={svgDataUrl} alt="QR Code" style={{ maxWidth: "100%", height: "auto" }} />
          ) : (
            <span className="preview-empty">{opts.content.trim() ? "Invalid content" : "Enter content above"}</span>
          )}
        </div>
      </div>

      <div className="card">
        {banner && <div className={`banner banner-${banner.type}`}>{banner.msg}</div>}

        {!isAllowed && (
          <div className="banner banner-error">
            You need permission to add SVGs on this project — ask the project owner to update your access.
          </div>
        )}

        <button className="btn btn-primary" disabled={busy || !opts.content.trim() || !isAllowed} onClick={handleInsert}>
          {busy ? "Inserting..." : "Insert QR Code"}
        </button>
      </div>
    </>
  )
}
