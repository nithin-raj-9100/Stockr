import { useTheme } from "next-themes"
import { Sun, Moon, Monitor } from "lucide-react"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  // Determine active icon representing the selected state
  const ActiveIcon = 
    theme === "dark" ? Moon : theme === "system" ? Monitor : Sun

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          buttonVariants({ variant: "ghost" }),
          "w-full justify-start gap-3 px-3 py-2 h-auto text-sm font-normal text-muted-foreground hover:bg-muted hover:text-foreground rounded-md transition-colors cursor-default"
        )}
      >
        <ActiveIcon className="h-4 w-4 shrink-0" />
        <span className="capitalize">{(theme || "system")} Theme</span>
      </DropdownMenuTrigger>
      {/* 
        Align dropdown menu content to the right side of the trigger. 
        Because it is pinned to the bottom of a thin Sidebar, side="right" 
        ensures visual items never clip outside or overlap other sidebar elements.
      */}
      <DropdownMenuContent 
        side="right" 
        align="end" 
        className="w-48 bg-popover text-popover-foreground shadow-md border"
      >
        <DropdownMenuItem 
          onClick={() => setTheme("light")} 
          className="gap-2 focus:bg-accent focus:text-accent-foreground cursor-pointer"
        >
          <Sun className="h-4 w-4" />
          <span>Light</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme("dark")} 
          className="gap-2 focus:bg-accent focus:text-accent-foreground cursor-pointer"
        >
          <Moon className="h-4 w-4" />
          <span>Dark</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme("system")} 
          className="gap-2 focus:bg-accent focus:text-accent-foreground cursor-pointer"
        >
          <Monitor className="h-4 w-4" />
          <span>System</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
