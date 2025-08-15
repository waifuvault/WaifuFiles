import React from "react";
import { FileUpload } from "waifuvault-node-api";
import styles from "../page.module.css";
import { validateExpires } from "../utils/upload";

interface OptionsPanelProps {
    options: Partial<FileUpload>;
    onOptionsChange: (options: Partial<FileUpload>) => void;
}

export default function OptionsPanel({ options, onOptionsChange }: OptionsPanelProps) {
    const updateOption = <K extends keyof FileUpload>(key: K, value: FileUpload[K]) => {
        onOptionsChange({ ...options, [key]: value });
    };

    const handleExpiresChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        updateOption("expires", value);
        if (value === "" || validateExpires(value)) {
            e.target.setCustomValidity("");
        } else {
            e.target.setCustomValidity("Format: number + m/h/d (e.g., 1h, 30m, 2d)");
        }
    };

    return (
        <div className={styles.optionsPanel}>
            <h4>Upload Options</h4>

            <div className={styles.optionRow}>
                <label>
                    <input
                        type="checkbox"
                        checked={options.hideFilename ?? false}
                        onChange={e => updateOption("hideFilename", e.target.checked)}
                    />
                    Hide filename in URL
                </label>
            </div>

            <div className={styles.optionRow}>
                <label>
                    <input
                        type="checkbox"
                        checked={options.oneTimeDownload ?? false}
                        onChange={e => updateOption("oneTimeDownload", e.target.checked)}
                    />
                    One-time download (delete after first access)
                </label>
            </div>

            <div className={styles.optionRow}>
                <label>Password (encrypts file):</label>
                <input
                    type="password"
                    placeholder="Optional password"
                    value={options.password ?? ""}
                    onChange={e => updateOption("password", e.target.value)}
                    className={styles.optionInput}
                />
            </div>

            <div className={styles.optionRow}>
                <label>Expires (e.g., 1h, 30m, 2d):</label>
                <input
                    type="text"
                    placeholder="Optional expiry (1h, 30m, 2d)"
                    value={options.expires ?? ""}
                    onChange={handleExpiresChange}
                    className={styles.optionInput}
                    pattern="^$|^\d+[mhd]$"
                    title="Format: number + m/h/d (e.g., 1h, 30m, 2d)"
                />
            </div>

            <div className={styles.optionsSummary}>
                {Object.keys(options).length > 0 && (
                    <div>
                        <strong>Active options:</strong>
                        <ul>
                            {options.hideFilename && <li>Hide filename</li>}
                            {options.oneTimeDownload && <li>One-time download</li>}
                            {options.password && <li>Password protected</li>}
                            {options.expires && <li>Expires in {options.expires}</li>}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}
