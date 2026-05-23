import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Moon, Sun, Play } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function getInitialTheme() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("theme") === "light";
}

function getInitialHighlight() {
  if (typeof window === "undefined") return true;
  const stored = localStorage.getItem("verseHighlight");
  return stored === null ? true : stored === "true";
}

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const [isLight, setIsLight] = useState(getInitialTheme);
  const [highlightEnabled, setHighlightEnabled] = useState(getInitialHighlight);

  useEffect(() => {
    const root = document.documentElement;
    if (isLight) {
      root.classList.add("light");
      localStorage.setItem("theme", "light");
    } else {
      root.classList.remove("light");
      localStorage.setItem("theme", "dark");
    }
  }, [isLight]);

  useEffect(() => {
    localStorage.setItem("verseHighlight", String(highlightEnabled));
  }, [highlightEnabled]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>

      <h1 className="mt-6 text-center font-display text-4xl font-semibold tracking-tight">
        Settings
      </h1>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-lg font-medium">Appearance</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {isLight ? (
              <Sun className="h-5 w-5 text-muted-foreground" />
            ) : (
              <Moon className="h-5 w-5 text-muted-foreground" />
            )}
            <div>
              <p className="text-sm font-medium">Theme</p>
              <p className="text-xs text-muted-foreground">
                {isLight ? "Light mode is on" : "Dark mode is on"}
              </p>
            </div>
          </div>
          <Switch
            checked={isLight}
            onCheckedChange={setIsLight}
            aria-label="Toggle light theme"
          />
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-lg font-medium">Reading</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Play className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Verse Highlighting</p>
              <p className="text-xs text-muted-foreground">
                {highlightEnabled ? "Highlight follows video playback" : "Highlighting is off"}
              </p>
            </div>
          </div>
          <Switch
            checked={highlightEnabled}
            onCheckedChange={setHighlightEnabled}
            aria-label="Toggle verse highlighting"
          />
        </CardContent>
      </Card>
    </div>
  );
}

