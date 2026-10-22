import { useState } from "react"

interface ProUpsellProps {
  feature: string
  proUnlocked: boolean
  verifying: boolean
  verifyError: string | null
  licenseKeyInput: string
  onLicenseKeyChange: (key: string) => void
  onVerify: () => Promise<boolean>
  onLock: () => void
  onReset?: () => void
  whopProductUrl: string
  onBanner?: (msg: string) => void
}

const boxStyle = {
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  padding: 12,
  display: "flex",
  flexDirection: "column",
  gap: 8,
}

export function ProUpsell({
  feature,
  proUnlocked,
  verifying,
  verifyError,
  licenseKeyInput,
  onLicenseKeyChange,
  onVerify,
  onLock,
  onReset,
  whopProductUrl,
  onBanner,
}: ProUpsellProps) {
  const [consented, setConsented] = useState(false)

  if (proUnlocked) {
    return (
      <div style={{ ...boxStyle, borderColor: "#22c55e", background: "#f0fdf4", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: "#16a34a", fontSize: 14, fontWeight: 600 }}>Pro Unlocked</span>
          <button className="btn" style={{ color: "#ef4444", fontSize: 12, padding: "2px 10px", height: "auto", border: "1px solid #fecaca", borderRadius: 4 }} onClick={onLock} type="button">
            Revoke
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ ...boxStyle, borderColor: "#c7d2fe", background: "#fafafe" }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: "#1e293b" }}>{feature}</div>

      <a
        href={whopProductUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "inline-block",
          fontSize: 12,
          fontWeight: 600,
          color: "#fff",
          background: "#6366f1",
          borderRadius: 6,
          padding: "6px 16px",
          textAlign: "center",
          textDecoration: "none",
          width: "fit-content",
        }}
      >
        Buy Pro $19
      </a>

      <div style={{ fontSize: 11, color: "#94a3b8" }}>Already have a key?</div>

      <div style={{ fontSize: 10, color: "#94a3b8", lineHeight: 1.4 }}>
        This plugin uses Whop (whop.com) as an external payment verification service. Your license key is sent to our verification server at commerce-toolkit-official.vercel.app to validate your purchase. No other personal data is collected or stored.
      </div>

      <input
        type="text"
        placeholder="Paste your license key"
        value={licenseKeyInput}
        onChange={(e) => onLicenseKeyChange(e.target.value)}
        style={{ height: 32, fontSize: 12, padding: "0 10px", borderRadius: 6, border: "1px solid #e2e8f0", outline: "none", background: "#fff", width: "100%", boxSizing: "border-box" }}
      />

      <label style={{ display: "flex", alignItems: "flex-start", gap: 6, fontSize: 10, color: "#64748b", lineHeight: 1.4, cursor: "pointer" }}>
        <input
          type="checkbox"
          checked={consented}
          onChange={(e) => setConsented(e.target.checked)}
          style={{ marginTop: 2, flexShrink: 0 }}
        />
        I understand my license key will be sent to commerce-toolkit-official.vercel.app to verify my purchase.
      </label>

      <button
        disabled={verifying || !licenseKeyInput.trim() || !consented}
        onClick={async () => { const ok = await onVerify(); if (ok && onBanner) onBanner("Pro unlocked!") }}
        type="button"
        style={{
          height: 32,
          fontSize: 12,
          fontWeight: 600,
          padding: "0 16px",
          borderRadius: 6,
          border: "none",
          background: "#6366f1",
          color: "#fff",
          cursor: "pointer",
          width: "100%",
        }}
      >
        {verifying ? "Verifying..." : "Verify Key"}
      </button>

      {verifyError && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ fontSize: 11, color: "#ef4444" }}>{verifyError}</div>
          <button
            onClick={async () => { const ok = await onVerify(); if (ok && onBanner) onBanner("Pro unlocked!") }}
            disabled={verifying || !consented}
            type="button"
            style={{
              height: 28,
              fontSize: 11,
              fontWeight: 600,
              padding: "0 12px",
              borderRadius: 6,
              border: "1px solid #e2e8f0",
              background: "#fff",
              color: "#1e293b",
              cursor: "pointer",
              width: "fit-content",
            }}
          >
            {verifying ? "Retrying..." : "Retry"}
          </button>
        </div>
      )}

      {onReset && (
        <button onClick={onReset} type="button" style={{ fontSize: 10, color: "#94a3b8", background: "none", border: "none", cursor: "pointer", padding: 0, textAlign: "center" }}>
          Reset plugin data
        </button>
      )}
    </div>
  )
}
