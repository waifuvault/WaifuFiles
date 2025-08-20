import React from "react";
import styles from "./ClipboardIndicator.module.css";
import { ClipboardContent } from "@/app/hooks/useClipboard";
import { isTerminal, ThemeType } from "@/app/constants/theme";
import { useTheme } from "@/app/contexts/ThemeContext";

interface ClipboardIndicatorProps {
    clipboardContent: ClipboardContent;
    onPaste: () => void;
}

export default function ClipboardIndicator({ clipboardContent, onPaste }: ClipboardIndicatorProps) {
    const { currentTheme: theme, getThemeClass } = useTheme();

    if (!clipboardContent.hasContent) {
        return null;
    }

    const getIcon = () => {
        switch (clipboardContent.type) {
            case "files":
                return "bi-files";
            case "image":
                return "bi-image";
            case "url":
                return "bi-link-45deg";
            default:
                return "bi-clipboard";
        }
    };

    const getMessage = () => {
        switch (clipboardContent.type) {
            case "files":
                return `${clipboardContent.count} file${(clipboardContent.count || 0) > 1 ? "s" : ""} ready to paste`;
            case "image":
                return "Image ready to paste";
            case "url":
                return "URL ready to paste";
            default:
                return "Content ready to paste";
        }
    };

    const getShortcut = () => {
        const isMac = navigator.userAgent.includes("Mac");
        return isMac ? "⌘V" : "Ctrl+V";
    };

    const themeClass = getThemeClass();

    return (
        <div className={`${styles.clipboardIndicator} ${styles[themeClass]}`}>
            <div className={styles.clipboardContent}>
                {clipboardContent.preview && clipboardContent.type === "image" && (
                    <div className={styles.previewImage}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={clipboardContent.preview} alt="Clipboard preview" className={styles.previewImg} />
                    </div>
                )}

                <div className={styles.clipboardInfo}>
                    <div className={styles.clipboardIcon}>
                        <i className={`${getIcon()} ${styles.icon}`} aria-hidden="true"></i>
                    </div>

                    <div className={styles.clipboardText}>
                        <span className={styles.message}>{getMessage()}</span>
                        {clipboardContent.type === "url" && clipboardContent.preview && (
                            <span className={styles.urlPreview}>
                                {clipboardContent.preview.length > 50
                                    ? `${clipboardContent.preview.slice(0, 47)}...`
                                    : clipboardContent.preview}
                            </span>
                        )}
                    </div>
                </div>

                <button className={styles.pasteButton} onClick={onPaste} aria-label="Paste from clipboard">
                    <i className="bi-clipboard-check" aria-hidden="true"></i>
                    <span className={styles.shortcut}>{getShortcut()}</span>
                </button>
            </div>

            {isTerminal(theme) && (
                <div className={styles.terminalCursor}>
                    <span className={styles.cursor}>█</span>
                </div>
            )}

            {theme === ThemeType.CYBERPUNK && <div className={styles.cyberpunkGlow}></div>}
        </div>
    );
}
