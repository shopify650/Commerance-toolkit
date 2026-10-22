import { useState } from "react"
import StripeTab from "./tabs/StripeTab"
import QRTab from "./tabs/QRTab"
import CountdownTab from "./tabs/CountdownTab"

type Tab = "stripe" | "qr" | "countdown"

export function App() {
  const [tab, setTab] = useState<Tab>("stripe")

  return (
    <>
      <div className="tab-bar">
        <button className={`tab-btn ${tab === "stripe" ? "active" : ""}`} onClick={() => setTab("stripe")}>
          Stripe
        </button>
        <button className={`tab-btn ${tab === "qr" ? "active" : ""}`} onClick={() => setTab("qr")}>
          QR Code
        </button>
        <button className={`tab-btn ${tab === "countdown" ? "active" : ""}`} onClick={() => setTab("countdown")}>
          Countdown
        </button>
      </div>
      <div className="panel">
        {tab === "stripe" && <StripeTab />}
        {tab === "qr" && <QRTab />}
        {tab === "countdown" && <CountdownTab />}
      </div>
    </>
  )
}
