"use client";

import React, { createContext, ReactNode, useContext, useEffect, useState } from "react";

export type ThemeType = "anime" | "cyberpunk" | "terminal" | "minimal";

export interface Theme {
    id: string;
    name: string;
    description: string;
    preview: string;
    icon: string; // Add icon property
}

export const themes: Theme[] = [
    {
        id: "anime",
        name: "Anime",
        description: "Gradient theme with sparkles",
        preview: "🌸",
        icon: "bi-stars", // Sparkles/stars for anime theme
    },
    {
        id: "cyberpunk",
        name: "Cyberpunk",
        description: "Neon lights",
        preview: "🌃",
        icon: "bi-cpu", // CPU/tech icon for cyberpunk
    },
    {
        id: "terminal",
        name: "Terminal",
        description: "Green-on-black terminal style",
        preview: "💻",
        icon: "bi-terminal", // Terminal icon
    },
    {
        id: "orangeterminal",
        name: "Terminal Orange",
        description: "Orange-on-black terminal style",
        preview: "💻",
        icon: "bi-terminal", // Terminal icon
    },
    {
        id: "minimal",
        name: "Minimal",
        description: "Light and simple design",
        preview: "⚪",
        icon: "bi-circle", // Clean circle for minimal
    },
];

interface ThemeContextType {
    currentTheme: ThemeType;
    setTheme: (theme: ThemeType) => void;
    themes: Theme[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
    children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
    const [currentTheme, setCurrentTheme] = useState<ThemeType>("anime");

    useEffect(() => {
        // Load theme from localStorage on mount
        const savedTheme = localStorage.getItem("waifuvault-theme") as ThemeType;
        if (savedTheme && themes.find(t => t.id === savedTheme)) {
            setCurrentTheme(savedTheme);
        }
    }, []);

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", currentTheme);
        localStorage.setItem("waifuvault-theme", currentTheme);
    }, [currentTheme]);

    const setTheme = (theme: ThemeType) => {
        setCurrentTheme(theme);
    };

    return <ThemeContext.Provider value={{ currentTheme, setTheme, themes }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
}
