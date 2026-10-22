export interface CountdownOptions {
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
  instanceId?: string
  padding: number
  fullWidth: boolean
}

export function generateCountdownSource(opts: CountdownOptions): string {
  const {
    message,
    expiredText,
    targetDate,
    durationMinutes,
    mode,
    displayStyle,
    backgroundColor,
    textColor,
    borderStyle,
    borderColor,
    radius,
    fontWeight,
    showDays,
    showHours,
    showMinutes,
    showSeconds,
    instanceId,
    padding,
    fullWidth,
  } = opts

  return `import { addPropertyControls, ControlType, RenderTarget } from "framer"
import { useState, useEffect } from "react"

interface CountdownTimerProps {
  mode: "fixed" | "evergreen"
  targetDate: string
  durationMinutes: number
  label: string
  expiredText: string
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
  instanceId: string
  padding: number
  fullWidth: boolean
}

function pad(n: number): string {
  return String(Math.max(0, n)).padStart(2, "0")
}

function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID()
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9)
}

function getRemaining(mode: string, targetDate: string, durationMinutes: number, instanceId: string): number {
  if (mode === "evergreen") {
    const key = "countdown-deadline-" + instanceId
    const existing = localStorage.getItem(key)
    const existingNum = Number(existing)
    if (!existing || existingNum - Date.now() <= 0) {
      const d = Date.now() + durationMinutes * 60 * 1000
      localStorage.setItem(key, String(d))
      return durationMinutes * 60 * 1000
    }
    return existingNum - Date.now()
  }
  return Math.max(0, new Date(targetDate).getTime() - Date.now())
}

export default function CountdownTimer(props: CountdownTimerProps) {
  const {
    mode = ${JSON.stringify(mode)},
    targetDate = ${JSON.stringify(targetDate)},
    durationMinutes = ${durationMinutes},
    label = ${JSON.stringify(message)},
    expiredText = ${JSON.stringify(expiredText)},
    displayStyle = ${JSON.stringify(displayStyle)},
    backgroundColor = ${JSON.stringify(backgroundColor)},
    textColor = ${JSON.stringify(textColor)},
    borderStyle = ${JSON.stringify(borderStyle)},
    borderColor = ${JSON.stringify(borderColor)},
    radius = ${radius},
    fontWeight = ${fontWeight},
    showDays = ${showDays},
    showHours = ${showHours},
    showMinutes = ${showMinutes},
    showSeconds = ${showSeconds},
    instanceId = generateId(),
    padding = ${padding},
    fullWidth = ${fullWidth},
  } = props

  const isEditor = RenderTarget.current() === RenderTarget.canvas
  const [remaining, setRemaining] = useState(() =>
    isEditor ? 86400000 : getRemaining(mode, targetDate, durationMinutes, instanceId)
  )

  useEffect(() => {
    if (isEditor) return
    const tick = () => setRemaining(getRemaining(mode, targetDate, durationMinutes, instanceId))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [mode, targetDate, durationMinutes, instanceId, isEditor])

  const totalSec = Math.floor(remaining / 1000)
  const days = Math.floor(totalSec / 86400)
  const hours = Math.floor((totalSec % 86400) / 3600)
  const minutes = Math.floor((totalSec % 3600) / 60)
  const seconds = totalSec % 60

  const containerBorder = displayStyle === "badge"
    ? "2px solid " + backgroundColor
    : borderStyle !== "none"
      ? "2px solid " + borderColor
      : "none"

  const units: Array<{ value: string; unitLabel: string; show: boolean }> = [
    { value: pad(days), unitLabel: "Days", show: showDays },
    { value: pad(hours), unitLabel: "Hours", show: showHours },
    { value: pad(minutes), unitLabel: "Min", show: showMinutes },
    { value: pad(seconds), unitLabel: "Sec", show: showSeconds },
  ].filter((u) => u.show)

  if (remaining <= 0) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: padding + "px " + (padding * 1.5) + "px",
          backgroundColor: displayStyle === "badge" ? "transparent" : backgroundColor,
          color: displayStyle === "badge" ? backgroundColor : textColor,
          borderRadius: displayStyle === "badge" ? 999 : radius,
          border: containerBorder,
          fontFamily: "system-ui, -apple-system, sans-serif",
          fontWeight: fontWeight,
          fontSize: displayStyle === "badge" ? 13 : 14,
          width: fullWidth ? "100%" : "fit-content",
        }}
      >
        {expiredText}
      </div>
    )
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: displayStyle === "bar" ? "row" : "column",
        alignItems: "center",
        justifyContent: "center",
        gap: displayStyle === "bar" ? 8 : 12,
        padding: padding + "px " + (padding * 1.5) + "px",
        backgroundColor: backgroundColor,
        color: textColor,
        borderRadius: radius,
        border: containerBorder,
        fontFamily: "system-ui, -apple-system, sans-serif",
        width: fullWidth ? "100%" : "fit-content",
        flexWrap: "wrap",
        boxSizing: "border-box",
      }}
    >
      {label && (
        <span
          style={{
            fontSize: 14,
            fontWeight: fontWeight,
            opacity: 0.9,
            marginRight: displayStyle === "bar" ? 8 : 0,
            marginBottom: displayStyle === "bar" ? 0 : 6,
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </span>
      )}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: displayStyle === "bar" ? 4 : 6,
          justifyContent: displayStyle === "badge" ? "center" : "flex-start",
        }}
      >
        {units.map((u, i) => (
          <div key={u.unitLabel} style={{ display: "flex", alignItems: "center" }}>
            {i > 0 && displayStyle !== "bar" && (
              <span
                style={{
                  width: 16,
                  textAlign: "center",
                  fontSize: 18,
                  fontWeight: 700,
                  color: textColor,
                  opacity: 0.4,
                  paddingBottom: 14,
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
                  minWidth: 44,
                  height: 48,
                  padding: "0 6px",
                  borderRadius: 8,
                  backgroundColor: displayStyle === "bar" ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)",
                  color: textColor,
                  fontSize: 22,
                  fontWeight: 700,
                  fontVariantNumeric: "tabular-nums",
                  fontFamily: "system-ui, -apple-system, sans-serif",
                }}
              >
                {u.value}
              </span>
              {displayStyle !== "bar" && (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 500,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    opacity: 0.6,
                    marginTop: 4,
                    color: textColor,
                  }}
                >
                  {u.unitLabel}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

addPropertyControls(CountdownTimer, {
  mode: {
    type: ControlType.Enum,
    title: "Mode",
    options: ["fixed", "evergreen"],
    optionTitles: ["Fixed Date", "Evergreen"],
    defaultValue: ${JSON.stringify(mode)},
  },
  targetDate: {
    type: ControlType.String,
    title: "Target Date",
    defaultValue: ${JSON.stringify(targetDate)},
    hidden: (props) => props.mode === "evergreen",
  },
  durationMinutes: {
    type: ControlType.Number,
    title: "Duration (min)",
    min: 1,
    max: 43200,
    defaultValue: ${durationMinutes},
    hidden: (props) => props.mode === "fixed",
  },
  label: {
    type: ControlType.String,
    title: "Label",
    defaultValue: ${JSON.stringify(message)},
  },
  expiredText: {
    type: ControlType.String,
    title: "Expired Text",
    defaultValue: ${JSON.stringify(expiredText)},
  },
  displayStyle: {
    type: ControlType.Enum,
    title: "Style",
    options: ["bar", "badge"],
    optionTitles: ["Bar", "Badge"],
    defaultValue: ${JSON.stringify(displayStyle)},
  },
  backgroundColor: {
    type: ControlType.Color,
    title: "Background",
    defaultValue: ${JSON.stringify(backgroundColor)},
  },
  textColor: {
    type: ControlType.Color,
    title: "Text",
    defaultValue: ${JSON.stringify(textColor)},
  },
  borderStyle: {
    type: ControlType.Enum,
    title: "Border",
    options: ["none", "solid", "dashed", "dotted"],
    optionTitles: ["None", "Solid", "Dashed", "Dotted"],
    defaultValue: ${JSON.stringify(borderStyle)},
  },
  borderColor: {
    type: ControlType.Color,
    title: "Border Color",
    defaultValue: ${JSON.stringify(borderColor)},
    hidden: (props) => props.borderStyle === "none",
  },
  radius: {
    type: ControlType.Number,
    title: "Radius",
    min: 0,
    max: 40,
    defaultValue: ${radius},
  },
  fontWeight: {
    type: ControlType.Enum,
    title: "Weight",
    options: [400, 500, 600, 700],
    optionTitles: ["Normal", "Medium", "Semi Bold", "Bold"],
    defaultValue: ${fontWeight},
  },
  showDays: {
    type: ControlType.Boolean,
    title: "Days",
    defaultValue: ${showDays},
  },
  showHours: {
    type: ControlType.Boolean,
    title: "Hours",
    defaultValue: ${showHours},
  },
  showMinutes: {
    type: ControlType.Boolean,
    title: "Minutes",
    defaultValue: ${showMinutes},
  },
  showSeconds: {
    type: ControlType.Boolean,
    title: "Seconds",
    defaultValue: ${showSeconds},
  },
  padding: {
    type: ControlType.Number,
    title: "Padding",
    min: 4,
    max: 40,
    defaultValue: ${padding},
  },
  fullWidth: {
    type: ControlType.Boolean,
    title: "Full width",
    defaultValue: ${fullWidth},
  },
  instanceId: {
    type: ControlType.String,
    title: "Instance ID",
    defaultValue: ${JSON.stringify(instanceId ?? "generated")},
    hidden: () => true,
  },
})`
}
