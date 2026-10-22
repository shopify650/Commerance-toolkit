import "@framer/plugin/framer.css"
import React from "react"
import ReactDOM from "react-dom/client"
import { framer } from "@framer/plugin"
import { App } from "./App"
import { ErrorBoundary } from "./ErrorBoundary"
import "./App.css"

let initOk = false
try {
  framer.showUI({
    position: "top right",
    width: 380,
    height: 580,
  })
  initOk = true
} catch {
  const root = document.getElementById("root")
  if (root) {
    root.innerHTML = `<div style="padding:24px;color:#ef4444;font-family:system-ui,sans-serif;font-size:14px"><strong>Plugin failed to initialize.</strong><p style="margin:8px 0 0;color:#64748b">Reload the page to try again.</p></div>`
  }
}

if (initOk) {
  const root = document.getElementById("root")
  if (!root) throw new Error("Root element not found")
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  )
}
