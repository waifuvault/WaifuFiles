import React from "react";
import { FileUpload } from "waifuvault-node-api";
import styles from "../page.module.css";
import { validateExpires } from "../utils/upload";

interface OptionsPanelProps {
    onOptionsChange: (options: Partial<FileUpload>) => void;
    options: Partial<FileUpload>;
}

export default function OptionsPanel({ onOptionsChange, options }: OptionsPanelProps) {
    const updateOption = <K extends keyof FileUpload>(key: K, value: FileUpload[K]) => {
        onOptionsChange({ ...options, [key]: value });
    };

    const handleExpiresChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target;
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
                        checked={options.hideFilename ?? false}
                        onChange={e => {
                            updateOption("hideFilename", e.target.checked);
                        }}
                        type="checkbox"
                    />
                    Hide filename in URL
                </label>
            </div>

            <div className={styles.optionRow}>
                <label>
                    <input
                        checked={options.oneTimeDownload ?? false}
                        onChange={e => {
                            updateOption("oneTimeDownload", e.target.checked);
                        }}
                        type="checkbox"
                    />
                    One-time download (delete after first access)
                </label>
            </div>

            <div className={styles.optionRow}>
                <label>Password (encrypts file):</label>
                <input
                    className={styles.optionInput}
                    onChange={e => {
                        updateOption("password", e.target.value);
                    }}
                    placeholder="Optional password"
                    type="password"
                    value={options.password ?? ""}
                />
            </div>

            <div className={styles.optionRow}>
                <label>Expires (e.g., 1h, 30m, 2d):</label>
                <input
                    className={styles.optionInput}
                    onChange={handleExpiresChange}
                    pattern="^$|^\d+[mhd]$"
                    placeholder="Optional expiry (1h, 30m, 2d)"
                    title="Format: number + m/h/d (e.g., 1h, 30m, 2d)"
                    type="text"
                    value={options.expires ?? ""}
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
