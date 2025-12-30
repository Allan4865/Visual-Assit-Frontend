'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Theme = 'default' | 'high-contrast';
export type TextSize = 'normal' | 'large' | 'extra-large';

interface AccessibilityContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    textSize: TextSize;
    setTextSize: (size: TextSize) => void;
    isScreenReaderOptimized: boolean;
    setScreenReaderOptimized: (enabled: boolean) => void;
    toggleTheme: () => void;
    cycleTextSize: () => void;
    speak: (message: string, interrupt?: boolean) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: ReactNode }) {
    // High contrast mode is the default for accessibility
    const [theme, setTheme] = useState<Theme>('high-contrast');
    const [textSize, setTextSize] = useState<TextSize>('normal');
    // Enable Screen Reader Optimization (TTS) by default
    const [isScreenReaderOptimized, setScreenReaderOptimized] = useState(true);

    // Apply theme and text size to document root
    useEffect(() => {
        const root = document.documentElement;

        // Reset classes
        root.classList.remove('theme-default', 'theme-high-contrast');
        root.classList.remove('text-normal', 'text-large', 'text-extra-large');

        // Add active classes
        root.classList.add(`theme-${theme}`);
        root.classList.add(`text-${textSize}`);

        // Data attribute for Tailwind
        root.setAttribute('data-theme', theme);
        root.setAttribute('data-text-size', textSize);

    }, [theme, textSize]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'default' ? 'high-contrast' : 'default');
    };

    const cycleTextSize = () => {
        setTextSize(prev => {
            if (prev === 'normal') return 'large';
            if (prev === 'large') return 'extra-large';
            return 'normal';
        });
    };

    const speak = (message: string, interrupt = true) => {
        // If optimization is disabled, do not speak
        if (!isScreenReaderOptimized) return;

        if (typeof window === 'undefined') return;
        const synth = window.speechSynthesis;
        if (!synth) return;

        if (interrupt) synth.cancel();

        const utter = new SpeechSynthesisUtterance(message);
        utter.lang = 'es-ES';
        utter.rate = 1.2;
        synth.speak(utter);
    };

    return (
        <AccessibilityContext.Provider
            value={{
                theme,
                setTheme,
                textSize,
                setTextSize,
                isScreenReaderOptimized,
                setScreenReaderOptimized,
                toggleTheme,
                cycleTextSize,
                speak,
            }}
        >
            {children}
        </AccessibilityContext.Provider>
    );
}

export function useAccessibility() {
    const context = useContext(AccessibilityContext);
    if (context === undefined) {
        throw new Error('useAccessibility must be used within an AccessibilityProvider');
    }
    return context;
}
