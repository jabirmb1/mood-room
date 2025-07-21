// used to set dark mode and light mode with unique icon

"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useState, useEffect } from "react"

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme, setTheme } = useTheme()

  useEffect(() => setMounted(true), [])

  if (!mounted) return null //

  return (
    <div className="relative inline-block">
      <button onClick={() => setTheme(resolvedTheme === "light" ? "dark" : "light")}>
        {resolvedTheme === "light" ? (
          <Sun className="h-[1.2rem] w-[1.2rem] transition-all hover:text-grey-500" />
        ) : (
          <Moon className="h-[1.2rem] w-[1.2rem] transition-all hover:text-neutral-500" />
        )}
    </button>
    </div>
  )
}