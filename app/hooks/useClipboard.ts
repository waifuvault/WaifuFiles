"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface ClipboardContent {
    type: "files" | "image" | "url" | "text" | "empty";
    hasContent: boolean;
    preview?: string;
    count?: number;
}

export interface UseClipboardOptions {
    onFilesDetected?: (files: File[]) => void;
    onUrlDetected?: (url: string) => void;
    enabled?: boolean;
}

export function useClipboard({ onFilesDetected, onUrlDetected, enabled = true }: UseClipboardOptions = {}) {
    const [clipboardContent, setClipboardContent] = useState<ClipboardContent>({
        type: "empty",
        hasContent: false,
    });
    const [isCheckingClipboard, setIsCheckingClipboard] = useState(false);

    const enabledRef = useRef(enabled);
    const onFilesDetectedRef = useRef(onFilesDetected);
    const onUrlDetectedRef = useRef(onUrlDetected);

    enabledRef.current = enabled;
    onFilesDetectedRef.current = onFilesDetected;
    onUrlDetectedRef.current = onUrlDetected;

    const checkClipboardContentRef = useRef<() => Promise<void>>(null);
    const pasteFromClipboardRef = useRef<() => Promise<void>>(null);

    useEffect(() => {
        const checkClipboardContent = async () => {
            if (!enabledRef.current || !navigator.clipboard) {
                return;
            }

            setIsCheckingClipboard(prev => {
                if (prev) {
                    return prev;
                }
                return true;
            });

            try {
                try {
                    const text = await navigator.clipboard.readText();
                    if (text && isValidUrl(text)) {
                        setClipboardContent({
                            type: "url",
                            hasContent: true,
                            preview: text,
                        });
                        setIsCheckingClipboard(false);
                        return;
                    }
                } catch (error) {
                    console.error("Failed to read text from clipboard:", error);
                }

                const clipboardItems = await navigator.clipboard.read();

                for (const clipboardItem of clipboardItems) {
                    const imageType = clipboardItem.types.find(type => type.startsWith("image/"));

                    if (imageType) {
                        const blob = await clipboardItem.getType(imageType);
                        const url = URL.createObjectURL(blob);

                        setClipboardContent({
                            type: "image",
                            hasContent: true,
                            preview: url,
                        });
                        setIsCheckingClipboard(false);
                        return;
                    }
                }

                setClipboardContent({
                    type: "empty",
                    hasContent: false,
                });
            } catch (error) {
                console.debug("Clipboard check failed:", error);
                setClipboardContent({
                    type: "empty",
                    hasContent: false,
                });
            }
            setIsCheckingClipboard(false);
        };

        const handlePaste = async (e: ClipboardEvent) => {
            if (!enabledRef.current) {
                return;
            }

            e.preventDefault();
            const clipboardData = e.clipboardData;
            if (!clipboardData) {
                return;
            }

            const files: File[] = [];

            const items = Array.from(clipboardData.items);
            for (const item of items) {
                if (item.kind === "file") {
                    const file = item.getAsFile();
                    if (file) {
                        files.push(file);
                    }
                }
            }

            if (files.length > 0) {
                onFilesDetectedRef.current?.(files);
                setClipboardContent({
                    type: "files",
                    hasContent: true,
                    count: files.length,
                });
                return;
            }

            const text = clipboardData.getData("text");
            if (text && isValidUrl(text)) {
                onUrlDetectedRef.current?.(text);
                return;
            }
        };

        const pasteFromClipboard = async () => {
            if (!enabledRef.current || !navigator.clipboard) {
                return;
            }

            try {
                const clipboardItems = await navigator.clipboard.read();
                const files: File[] = [];

                for (const clipboardItem of clipboardItems) {
                    for (const type of clipboardItem.types) {
                        if (type.startsWith("image/")) {
                            const blob = await clipboardItem.getType(type);
                            const file = new File([blob], `clipboard-image-${Date.now()}.png`, { type });
                            files.push(file);
                        }
                    }
                }

                if (files.length > 0) {
                    onFilesDetectedRef.current?.(files);
                    return;
                }

                // Try to get text (URLs)
                const text = await navigator.clipboard.readText();
                if (text && isValidUrl(text)) {
                    onUrlDetectedRef.current?.(text);
                    return;
                }
            } catch (error) {
                console.error("Failed to paste from clipboard:", error);
            }
        };

        checkClipboardContentRef.current = checkClipboardContent;
        pasteFromClipboardRef.current = pasteFromClipboard;

        const handleFocus = () => {
            if (enabledRef.current) {
                checkClipboardContent();
            }
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "v") {
                if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                    return;
                }
                e.preventDefault();
                pasteFromClipboard();
            }
        };

        document.addEventListener("paste", handlePaste);
        document.addEventListener("keydown", handleKeyDown);
        window.addEventListener("focus", handleFocus);

        if (enabledRef.current) {
            checkClipboardContent();
        }

        return () => {
            document.removeEventListener("paste", handlePaste);
            document.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("focus", handleFocus);
        };
    }, []);

    const checkClipboardContent = useCallback(async () => {
        await checkClipboardContentRef.current?.();
    }, []);

    const pasteFromClipboard = useCallback(async () => {
        await pasteFromClipboardRef.current?.();
    }, []);

    return {
        clipboardContent,
        isCheckingClipboard,
        pasteFromClipboard,
        checkClipboardContent,
    };
}

function isValidUrl(string: string): boolean {
    try {
        const url = new URL(string);
        return url.protocol === "http:" || url.protocol === "https:";
    } catch {
        return false;
    }
}
