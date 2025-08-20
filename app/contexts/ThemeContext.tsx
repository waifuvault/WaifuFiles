"use client";

import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { ThemeType } from "@/app/constants/theme";

export const localStoreThemeKey = "waifuvault-theme";
export const localStoreParticlesKey = "waifuvault-particles-enabled";

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
    particlesEnabled: boolean;
    setParticlesEnabled: (enabled: boolean) => void;
    getThemeClass: () => string;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
    children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
    const [currentTheme, setCurrentTheme] = useState<ThemeType>(ThemeType.DEFAULT);
    const [particlesEnabled, setParticlesEnabledState] = useState<boolean>(true);

    useEffect(() => {
        const savedTheme = localStorage.getItem(localStoreThemeKey) as ThemeType;
        if (savedTheme && themes.find(t => t.id === savedTheme)) {
            setCurrentTheme(savedTheme);
        }

        const savedParticles = localStorage.getItem(localStoreParticlesKey);
        if (savedParticles !== null) {
            setParticlesEnabledState(savedParticles === "true");
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

    const setTheme = useCallback((theme: ThemeType) => {
        setCurrentTheme(theme);
    }, []);

    const setParticlesEnabled = useCallback((enabled: boolean) => {
        setParticlesEnabledState(enabled);
        localStorage.setItem(localStoreParticlesKey, enabled.toString());
    }, []);

    const getThemeClass = useCallback(() => {
        return currentTheme ? `theme${currentTheme.charAt(0).toUpperCase() + currentTheme.slice(1)}` : "";
    }, [currentTheme]);

    return (
        <ThemeContext.Provider
            value={{
                currentTheme,
                setTheme,
                themes,
                particlesEnabled,
                setParticlesEnabled,
                getThemeClass,
            }}
        >
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
}
