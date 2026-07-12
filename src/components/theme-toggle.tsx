"use client";
import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
const subscribe = () => () => undefined;
export function ThemeToggle() { const { resolvedTheme, setTheme } = useTheme(); const mounted = useSyncExternalStore(subscribe, () => true, () => false); return <Button type="button" variant="ghost" size="icon" aria-label={mounted && resolvedTheme === "dark" ? "Use light theme" : "Use dark theme"} onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>{mounted && resolvedTheme === "dark" ? <Sun aria-hidden="true"/> : <Moon aria-hidden="true"/>}</Button>; }
