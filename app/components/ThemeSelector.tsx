"use client";

import React, { useEffect, useState } from "react";
import styles from "./ThemeSelector.module.css";
import { themes } from "@/app/contexts/ThemeContext";

export default function ThemeSelector() {
    const [currentTheme, setCurrentTheme] = useState<string>("anime");
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem("theme");
        if (saved && themes.some(theme => theme.id === saved)) {
            setCurrentTheme(saved);
            document.documentElement.setAttribute("data-theme", saved);
        }
    }, []);

    const handleThemeChange = (themeId: string) => {
        setCurrentTheme(themeId);
        document.documentElement.setAttribute("data-theme", themeId);
        localStorage.setItem("theme", themeId);
        setIsOpen(false);
    };

    const currentThemeData = themes.find(theme => theme.id === currentTheme) || themes[0];

    return (
        <div className={styles.themeSelector}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={styles.themeButton}
                aria-label="Theme selector"
                aria-expanded={isOpen}
            >
                <i className={`${currentThemeData.icon} ${styles.themeIcon}`} aria-hidden="true"></i>
                <span className={styles.themeText}>{currentThemeData.name}</span>
                <i
                    className={`bi-chevron-down ${styles.chevron} ${isOpen ? styles.chevronUp : styles.chevronDown}`}
                    aria-hidden="true"
                ></i>
            </button>

            {isOpen && (
                <div className={styles.popup}>
                    <div className={styles.popupHeader}>
                        <h3>Choose Theme</h3>
                        <button
                            onClick={() => setIsOpen(false)}
                            className={styles.closeButton}
                            aria-label="Close theme selector"
                        >
                            <i className="bi-x" aria-hidden="true"></i>
                        </button>
                    </div>

                    <div className={styles.themeGrid}>
                        {themes.map(theme => (
                            <button
                                key={theme.id}
                                onClick={() => handleThemeChange(theme.id)}
                                className={`${styles.themeOption} ${
                                    currentTheme === theme.id ? styles.themeOptionActive : ""
                                }`}
                            >
                                <div className={styles.themePreview}>
                                    <div className={`${styles.themePreviewBg} ${styles[`preview${theme.id}`]}`}>
                                        <div className={styles.previewContent}>
                                            <div className={styles.previewHeader}></div>
                                            <div className={styles.previewBody}>
                                                <div className={styles.previewLine}></div>
                                                <div className={styles.previewLine}></div>
                                            </div>
                                            <div className={styles.previewButton}></div>
                                        </div>
                                    </div>
                                    <div className={styles.themePreviewIcon}>
                                        <i className={theme.icon} aria-hidden="true"></i>
                                    </div>
                                </div>

                                <div className={styles.themeInfo}>
                                    <h4>{theme.name}</h4>
                                    <p>{theme.description}</p>
                                </div>

                                {currentTheme === theme.id && (
                                    <div className={styles.activeIndicator}>
                                        <i className="bi-check" aria-hidden="true"></i>
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
