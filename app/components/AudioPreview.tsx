import React, { useEffect, useState } from "react";
import styles from "@/app/components/Enhanced3DFilePreview.module.css";
import { ThemeType } from "@/app/constants/theme";
import { useTheme } from "@/app/contexts/ThemeContext";

export function AudioPreview() {
    const [waveformData, setWaveformData] = useState<number[]>([]);
    const { currentTheme: theme } = useTheme();

    useEffect(() => {
        const generateWaveform = () => {
            const bars = 32;
            const data = Array.from({ length: bars }, () => Math.random() * 0.8 + 0.2);
            setWaveformData(data);
        };

        generateWaveform();
        const interval = setInterval(generateWaveform, 150);

        return () => clearInterval(interval);
    }, []);

    const getWaveformColor = () => {
        switch (theme) {
            case ThemeType.CYBERPUNK:
                return "#00ffff";
            case ThemeType.GREEN_PHOSPHOR:
                return "#00ff00";
            case ThemeType.ORANGE_PHOSPHOR:
                return "#ffa500";
            case ThemeType.MINIMAL:
                return "#007bff";
            case ThemeType.DEFAULT:
            default:
                return "#667eea";
        }
    };

    return (
        <div className={styles.audioContainer}>
            <div className={styles.audioIcon}>
                <i aria-hidden="true" className="bi bi-music-note-beamed"></i>
            </div>
            <div className={styles.waveform}>
                {waveformData.map((height, index) => (
                    <div
                        key={index}
                        className={styles.waveformBar}
                        style={{
                            height: `${height * 100}%`,
                            backgroundColor: getWaveformColor(),
                            animationDelay: `${index * 0.05}s`,
                        }}
                    />
                ))}
            </div>
        </div>
    );
}
