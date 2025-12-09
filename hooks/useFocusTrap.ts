import { useEffect, useRef, RefObject } from 'react';

/**
 * Hook to trap focus inside a modal and restore it when closed.
 * @param isOpen - Whether the modal is currently open
 * @param modalRef - Ref to the modal container element
 */
export function useFocusTrap(isOpen: boolean, modalRef: RefObject<HTMLElement | null>) {
    const previousFocusRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        if (isOpen) {
            // Save currently focused element
            previousFocusRef.current = document.activeElement as HTMLElement;

            // Move focus to the modal or its first focusable element
            // Use setTimeout to ensure DOM is ready if modal is conditionally rendered
            setTimeout(() => {
                if (modalRef.current) {
                    const focusableElements = modalRef.current.querySelectorAll(
                        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                    );

                    if (focusableElements.length > 0) {
                        (focusableElements[0] as HTMLElement).focus();
                    } else {
                        modalRef.current.focus();
                    }
                }
            }, 10);

            // Trap focus handler
            const handleTabKey = (e: KeyboardEvent) => {
                if (!modalRef.current) return;

                const focusableElements = modalRef.current.querySelectorAll(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                );

                if (focusableElements.length === 0) return;

                const firstElement = focusableElements[0] as HTMLElement;
                const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

                // Check if focus has escaped the modal (or is about to)
                if (!modalRef.current.contains(document.activeElement)) {
                    // If focus is outside, force it back to first element
                    e.preventDefault();
                    firstElement.focus();
                    return;
                }

                if (e.key === 'Tab') {
                    if (e.shiftKey) {
                        // Shift + Tab
                        if (document.activeElement === firstElement) {
                            e.preventDefault();
                            lastElement.focus();
                        }
                    } else {
                        // Tab
                        if (document.activeElement === lastElement) {
                            e.preventDefault();
                            firstElement.focus();
                        }
                    }
                }
            };

            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.key === 'Tab') {
                    handleTabKey(e);
                }
                // Optional: Close on Escape could be handled here or in the component
            };

            document.addEventListener('keydown', handleKeyDown);

            return () => {
                document.removeEventListener('keydown', handleKeyDown);
            };
        } else {
            // Restore focus when modal closes
            if (previousFocusRef.current) {
                previousFocusRef.current.focus();
                previousFocusRef.current = null;
            }
        }
    }, [isOpen, modalRef]);
}
