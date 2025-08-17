"use client";

import React, { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { ThemeType } from "@/app/constants/theme";

export const localStoreThemeKey = "waifuvault-theme";

export interface Theme {
    description: string;
    icon: string;
    id: ThemeType;
    name: string;
    preview: string;
}

export const themes: Theme[] = [
    {
        description: "Gradient theme with sparkles",
        icon: "bi-stars", // Sparkles/stars for anime theme
        id: ThemeType.ANIME,
        name: "Anime",
        preview: "🌸",
    },
    {
        description: "Neon lights",
        icon: "bi-cpu", // CPU/tech icon for cyberpunk
        id: ThemeType.CYBERPUNK,
        name: "Cyberpunk",
        preview: "🌃",
    },
    {
        description: "Green phosphor terminal style",
        icon: "bi-terminal", // Terminal icon
        id: ThemeType.GREEN_PHOSPHOR,
        name: "Green Phosphor",
        preview: "💻",
    },
    {
        id: ThemeType.ORANGE_PHOSPHOR,
        name: "Amber Phosphor",
        description: "Amber phosphor terminal style",
        preview: "💻",
        icon: "bi-terminal", // Terminal icon
    },
    {
        description: "Light and simple design",
        icon: "bi-circle", // Clean circle for minimal
        id: ThemeType.MINIMAL,
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
    const [currentTheme, setCurrentTheme] = useState<ThemeType>(ThemeType.DEFAULT);

    useEffect(() => {
        const savedTheme = localStorage.getItem(localStoreThemeKey) as ThemeType;
        if (savedTheme && themes.find(t => t.id === savedTheme)) {
            setCurrentTheme(savedTheme);
        }
    }, []);

    useEffect(() => {
        const observer = new MutationObserver(() => {
            const domTheme = document.documentElement.dataset.theme as ThemeType;
            if (domTheme && domTheme !== currentTheme && themes.find(t => t.id === domTheme)) {
                setCurrentTheme(domTheme);
            }
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["data-theme"],
        });

        return () => observer.disconnect();
    }, [currentTheme]);

    useEffect(() => {
        document.documentElement.dataset.theme = currentTheme;
        localStorage.setItem(localStoreThemeKey, currentTheme);
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
