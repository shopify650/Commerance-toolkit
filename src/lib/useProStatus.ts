import { useState, useEffect, useCallback } from "react"

const VERIFY_URL = "https://commerce-toolkit-official.vercel.app/api/verify-license"
const ENTITLEMENT_LS = "commerce-toolkit-pro-entitlement"
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000

const WHOP_PRODUCT_URL = "https://whop.com/omnihook/test-cc-e77a"

interface CachedEntitlement {
  valid: boolean
  verifiedAt: number
}

function loadFromStorage<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    if (raw) return JSON.parse(raw) as T
  } catch {
    /* ignore */
  }
  return null
}

function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch {
    /* ignore */
  }
}

function removeFromStorage(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    /* ignore */
  }
}

export function useProStatus() {
  const [proUnlocked, setProUnlocked] = useState(false)
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(false)
  const [verifyError, setVerifyError] = useState<string | null>(null)
  const [licenseKeyInput, setLicenseKeyInput] = useState("")

  useEffect(() => {
    const cached = loadFromStorage<CachedEntitlement>(ENTITLEMENT_LS)
    if (cached && cached.valid && Date.now() - cached.verifiedAt < CACHE_TTL) {
      setProUnlocked(true)
    }
    setLoading(false)
  }, [])

  const verifyWithBackend = useCallback(async (key: string): Promise<boolean> => {
    setVerifying(true)
    setVerifyError(null)
    try {
      const res = await fetch(VERIFY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ licenseKey: key }),
      })
      if (!res.ok) {
        setVerifyError(`Server error (${res.status}). Please try again later.`)
        setVerifying(false)
        return false
      }
      const data = await res.json()
      if (data.valid) {
        saveToStorage<CachedEntitlement>(ENTITLEMENT_LS, {
          valid: true,
          verifiedAt: Date.now(),
        })
        setProUnlocked(true)
        setVerifying(false)
        return true
      }
      setVerifyError(data.error || "Invalid or expired license key")
      setVerifying(false)
      return false
    } catch {
      setVerifyError("Could not connect to verification server. Check your internet connection and try again.")
      setVerifying(false)
      return false
    }
  }, [])

  const verifyLicense = useCallback(async (): Promise<boolean> => {
    if (!licenseKeyInput.trim()) {
      setVerifyError("Enter your license key")
      return false
    }
    return verifyWithBackend(licenseKeyInput.trim())
  }, [licenseKeyInput, verifyWithBackend])

  const lockPro = useCallback(async () => {
    removeFromStorage(ENTITLEMENT_LS)
    setProUnlocked(false)
    setVerifyError(null)
  }, [])

  const reset = useCallback(async () => {
    removeFromStorage(ENTITLEMENT_LS)
    setProUnlocked(false)
    setLicenseKeyInput("")
    setVerifyError(null)
  }, [])

  return {
    proUnlocked,
    loading,
    verifying,
    verifyError,
    licenseKeyInput,
    setLicenseKeyInput,
    verifyLicense,
    lockPro,
    reset,
    whopProductUrl: WHOP_PRODUCT_URL,
  }
}
