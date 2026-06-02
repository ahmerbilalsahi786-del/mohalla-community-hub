'use client'

import { useState } from 'react'
import { Search, Bell, Sun, Moon, Plus, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function TopNavbar() {
  const [darkMode, setDarkMode] = useState(false)

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
    document.documentElement.classList.toggle('dark')
  }

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur-md">
      {/* Left Section - Page Title & Breadcrumb */}
      <div className="flex flex-col">
        <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Welcome back to your community</p>
      </div>

      {/* Center Section - Search */}
      <div className="hidden flex-1 justify-center px-8 md:flex">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search community, events, people..."
            className="h-10 w-full rounded-xl border-border bg-muted/50 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:border-primary focus:bg-background focus:ring-primary"
          />
          <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-md border border-border bg-muted px-1.5 py-0.5 text-xs text-muted-foreground sm:block">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right Section - Actions */}
      <div className="flex items-center gap-2">
        {/* Quick Action */}
        <Button 
          className="hidden gap-2 rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90 sm:flex"
        >
          <Plus size={16} />
          <span>New Post</span>
        </Button>

        {/* Notifications */}
        <button className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-muted/50 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
          <Bell size={20} />
          <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs font-semibold text-destructive-foreground">
            3
          </span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleDarkMode}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/50 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* User Menu */}
        <button className="flex items-center gap-2 rounded-xl bg-muted/50 py-1.5 pl-1.5 pr-3 transition-colors hover:bg-muted">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent" />
          <div className="hidden text-left md:block">
            <p className="text-sm font-semibold text-foreground">Ahmed K.</p>
          </div>
          <ChevronDown size={14} className="text-muted-foreground" />
        </button>
      </div>
    </header>
  )
}
