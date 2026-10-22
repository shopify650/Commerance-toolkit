export interface StripeButtonOptions {
  label: string
  paymentLink: string
  backgroundColor: string
  textColor: string
  radius: number
  padding: number
  fontWeight: number
  openInNewTab: boolean
  fullWidth: boolean
  height: number
}

export function generateStripeButtonSource(opts: StripeButtonOptions): string {
  const {
    label,
    paymentLink,
    backgroundColor,
    textColor,
    radius,
    padding,
    fontWeight,
    openInNewTab,
    fullWidth,
    height,
  } = opts

  return `import { addPropertyControls, ControlType } from "framer"

interface StripeCheckoutButtonProps {
  label: string
  paymentLink: string
  backgroundColor: string
  textColor: string
  radius: number
  padding: number
  fontWeight: number
  openInNewTab: boolean
  fullWidth: boolean
  height: number
}

export default function StripeCheckoutButton(props: StripeCheckoutButtonProps) {
  const {
    label = ${JSON.stringify(label)},
    paymentLink = ${JSON.stringify(paymentLink)},
    backgroundColor = ${JSON.stringify(backgroundColor)},
    textColor = ${JSON.stringify(textColor)},
    radius = ${radius},
    padding = ${padding},
    fontWeight = ${fontWeight},
    openInNewTab = ${openInNewTab},
    fullWidth = ${fullWidth},
    height = ${height},
  } = props

  const handleClick = () => {
    if (openInNewTab) {
      window.open(paymentLink, "_blank", "noopener,noreferrer")
    } else {
      window.location.href = paymentLink
    }
  }

  return (
    <button
      onClick={handleClick}
      style={{
        backgroundColor,
        color: textColor,
        borderRadius: radius + "px",
        padding: padding + "px " + (padding * 2) + "px",
        fontWeight,
        border: "none",
        cursor: "pointer",
        fontSize: 16,
        fontFamily: "system-ui, -apple-system, sans-serif",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        transition: "opacity 0.15s ease",
        width: fullWidth ? "100%" : undefined,
        height: height + "px",
      }}
    >
      {label}
    </button>
  )
}

addPropertyControls(StripeCheckoutButton, {
  label: {
    type: ControlType.String,
    title: "Label",
    defaultValue: ${JSON.stringify(label)},
  },
  paymentLink: {
    type: ControlType.String,
    title: "Payment Link",
    defaultValue: ${JSON.stringify(paymentLink)},
  },
  backgroundColor: {
    type: ControlType.Color,
    title: "Background",
    defaultValue: ${JSON.stringify(backgroundColor)},
  },
  textColor: {
    type: ControlType.Color,
    title: "Text Color",
    defaultValue: ${JSON.stringify(textColor)},
  },
  radius: {
    type: ControlType.Number,
    title: "Radius",
    min: 0,
    max: 40,
    defaultValue: ${radius},
  },
  padding: {
    type: ControlType.Number,
    title: "Padding",
    min: 8,
    max: 32,
    defaultValue: ${padding},
  },
  fontWeight: {
    type: ControlType.Enum,
    title: "Weight",
    options: [400, 500, 600, 700],
    optionTitles: ["Normal", "Medium", "Semi Bold", "Bold"],
    defaultValue: ${fontWeight},
  },
  openInNewTab: {
    type: ControlType.Boolean,
    title: "Open in new tab",
    defaultValue: ${openInNewTab},
  },
  fullWidth: {
    type: ControlType.Boolean,
    title: "Full width",
    defaultValue: ${fullWidth},
  },
  height: {
    type: ControlType.Number,
    title: "Height",
    min: 32,
    max: 80,
    defaultValue: ${height},
  },
})`
}
