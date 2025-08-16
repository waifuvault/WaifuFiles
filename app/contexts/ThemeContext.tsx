"use client";

import React, { createContext, ReactNode, useContext, useEffect, useState } from "react";

export interface Theme {
    description: string;
    icon: string; // Add icon property
    id: string;
    name: string;
    preview: string;
}

export type ThemeType = "anime" | "cyberpunk" | "minimal" | "terminal";

export const themes: Theme[] = [
    {
        description: "Gradient theme with sparkles",
        icon: "bi-stars", // Sparkles/stars for anime theme
        id: "anime",
        name: "Anime",
        preview: "🌸",
    },
    {
        description: "Neon lights",
        icon: "bi-cpu", // CPU/tech icon for cyberpunk
        id: "cyberpunk",
        name: "Cyberpunk",
        preview: "🌃",
    },
    {
        description: "Green phosphor terminal style",
        icon: "bi-terminal", // Terminal icon
        id: "terminal",
        name: "Green Phosphor",
        preview: "💻",
    },
    {
        id: "orangeterminal",
        name: "Amber Phosphor",
        description: "Amber phosphor terminal style",
        preview: "💻",
        icon: "bi-terminal", // Terminal icon
    },
    {
        description: "Light and simple design",
        icon: "bi-circle", // Clean circle for minimal
        id: "minimal",
        name: "Minimal",
        preview: "⚪",
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
        document.documentElement.dataset.theme = currentTheme;
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
