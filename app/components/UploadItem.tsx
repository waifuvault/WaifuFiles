import React, { useEffect, useState } from "react";
import { FileUpload } from "waifuvault-node-api";
import styles from "../page.module.css";
import { copyToClipboard, formatFileSize } from "../utils/upload";
import OptionsPanel from "./OptionsPanel";
import Enhanced3DFilePreview from "./Enhanced3DFilePreview";
import QRCodeGenerator from "./QRCodeGenerator";
import Dialog from "./Dialog";
import { UploadItem as UploadItemType } from "../types/upload";

interface UploadItemProps {
    onRemove: (id: string) => void;
    onResetToPending: (id: string) => void;
    onToggleOptions: (id: string) => void;
    onUpdateOptions: (id: string, options: Partial<FileUpload>) => void;
    onUpload: (id: string) => void;
    upload: UploadItemType;
}

export default function UploadItem({
    onRemove,
    onResetToPending,
    onToggleOptions,
    onUpdateOptions,
    onUpload,
    upload,
}: UploadItemProps) {
    const [copied, setCopied] = useState(false);
    const [showQRCode, setShowQRCode] = useState(false);
    const [showErrorDialog, setShowErrorDialog] = useState(false);

    const handleOptionsChange = (options: Partial<FileUpload>) => {
        onUpdateOptions(upload.id, options);
    };
    const handleCopy = async () => {
        if (upload.result?.url) {
            await copyToClipboard(upload.result.url);
            setCopied(true);
        }
    };

    const handleShowQRCode = () => {
        setShowQRCode(true);
    };

    const handleCloseQRCode = () => {
        setShowQRCode(false);
    };

    const handleShowErrorDialog = () => {
        setShowErrorDialog(true);
    };

    const handleCloseErrorDialog = () => {
        setShowErrorDialog(false);
    };

    useEffect(() => {
        if (!copied) {
            return;
        }
        const timer = setTimeout(() => {
            setCopied(false);
        }, 5000);
        return () => {
            clearTimeout(timer);
        };
    }, [copied]);

    return (
        <>
            <div
                className={`${styles.uploadItem} ${
                    upload.status === "queued" ? styles.processing : styles[upload.status]
                }`}
            >
                <div className={styles.uploadItemHeader}>
                    <Enhanced3DFilePreview
                        file={upload.file}
                        size="medium"
                        interactive={true}
                        showMetadata={upload.status === "completed"}
                    />

                    <div className={styles.fileInfo}>
                        <span className={styles.fileName}>{upload.file.name}</span>
                        <span className={styles.fileSize}>{formatFileSize(upload.file.size)}</span>
                    </div>

                    <div className={styles.uploadStatus}>
                        {upload.status === "pending" && (
                            <>
                                <button
                                    aria-label="Upload Options"
                                    className={styles.optionsBtn}
                                    onClick={() => {
                                        onToggleOptions(upload.id);
                                    }}
                                    title="Upload Options"
                                >
                                    <i aria-hidden="true" className="bi bi-gear"></i>
                                </button>
                                <button
                                    className={styles.uploadBtn}
                                    onClick={() => {
                                        onUpload(upload.id);
                                    }}
                                >
                                    Upload
                                </button>
                            </>
                        )}

                        {upload.status === "queued" && (
                            <div className={styles.uploading}>
                                <div className={styles.progressContainer}>
                                    <div className={styles.progressBar}>
                                        <div className={styles.progressFill} style={{ width: `0%` }}></div>
                                    </div>
                                    <span className={styles.progressText}>
                                        <i className="bi-hourglass-split" aria-hidden="true"></i> Queued
                                    </span>
                                </div>
                            </div>
                        )}

                        {(upload.status === "uploading" || upload.status === "processing") && (
                            <div className={styles.uploading}>
                                <div className={styles.progressContainer}>
                                    <div className={styles.progressBar}>
                                        <div
                                            className={styles.progressFill}
                                            style={{ width: `${upload.progress ?? 0}%` }}
                                        ></div>
                                    </div>
                                    <span className={styles.progressText}>
                                        {upload.status === "processing" ? "Processing..." : `${upload.progress ?? 0}%`}
                                    </span>
                                </div>
                            </div>
                        )}

                        {upload.status === "completed" && upload.result && (
                            <div className={styles.completed}>
                                <input className={styles.urlInput} readOnly type="text" value={upload.result.url} />
                                <div className={styles.completedActions}>
                                    <button className={styles.copyBtn} onClick={handleCopy}>
                                        {copied ? "Copied" : "Copy"}
                                    </button>
                                    <button
                                        className={styles.qrBtn}
                                        onClick={handleShowQRCode}
                                        title="Generate QR Code"
                                        aria-label="Generate QR Code"
                                    >
                                        <i className="bi-qr-code" aria-hidden="true"></i>
                                        QR
                                    </button>
                                </div>
                            </div>
                        )}

                        {upload.status === "error" && (
                            <div className={styles.errorSimple}>
                                <div className={styles.errorInfo}>
                                    <i className="bi-exclamation-triangle-fill" aria-hidden="true"></i>
                                    <span className={styles.errorLabel}>Upload failed</span>
                                </div>
                                <div className={styles.errorActions}>
                                    <button
                                        className={styles.errorDetailsBtn}
                                        onClick={handleShowErrorDialog}
                                        title="View error details"
                                    >
                                        Error Details
                                    </button>
                                    <button
                                        className={styles.retryBtn}
                                        onClick={() => {
                                            onUpload(upload.id);
                                        }}
                                        title="Retry upload"
                                    >
                                        <i className="bi-arrow-clockwise" aria-hidden="true"></i>
                                        Retry
                                    </button>
                                    <button
                                        className={styles.backToOptionsBtn}
                                        onClick={() => {
                                            onResetToPending(upload.id);
                                        }}
                                        title="Go back to options"
                                    >
                                        <i className="bi-gear" aria-hidden="true"></i>
                                        Options
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <button
                        aria-label={
                            upload.status === "uploading" || upload.status === "processing" ? "Cancel Upload" : "Remove"
                        }
                        className={styles.removeBtn}
                        onClick={() => {
                            onRemove(upload.id);
                        }}
                        title={
                            upload.status === "uploading" || upload.status === "processing"
                                ? "Cancel upload"
                                : "Remove file"
                        }
                    >
                        <i aria-hidden="true" className="bi bi-x-lg"></i>
                    </button>
                </div>

                {upload.showOptions && upload.status === "pending" && (
                    <OptionsPanel onOptionsChange={handleOptionsChange} options={upload.options} />
                )}
            </div>

            {showQRCode && upload.result?.url && (
                <Dialog isOpen={showQRCode} onClose={handleCloseQRCode} title="QR Code">
                    <QRCodeGenerator
                        url={upload.result.url}
                        fileName={upload.file.name}
                        onClose={handleCloseQRCode}
                        embedded={true}
                    />
                </Dialog>
            )}

            <Dialog isOpen={showErrorDialog} onClose={handleCloseErrorDialog} title="Error Details" maxWidth="500px">
                <div className={styles.errorDialog}>
                    <div className={styles.errorDialogIcon}>
                        <i className="bi-exclamation-triangle-fill" aria-hidden="true"></i>
                    </div>
                    <div className={styles.errorDialogContent}>
                        <h4>Upload Failed</h4>
                        <p>The upload could not be completed due to the following error:</p>
                        <div className={styles.errorDialogMessage}>
                            {upload.error || "An unexpected error occurred."}
                        </div>
                        <div className={styles.errorDialogActions}>
                            <button
                                className={styles.retryBtn}
                                onClick={() => {
                                    handleCloseErrorDialog();
                                    onUpload(upload.id);
                                }}
                            >
                                <i className="bi-arrow-clockwise" aria-hidden="true"></i>
                                Try Again
                            </button>
                            <button
                                className={styles.resetBtn}
                                onClick={() => {
                                    handleCloseErrorDialog();
                                    onResetToPending(upload.id);
                                }}
                            >
                                <i className="bi-gear" aria-hidden="true"></i>
                                Back to Options
                            </button>
                        </div>
                    </div>
                </div>
            </Dialog>
        </>
    );
}
