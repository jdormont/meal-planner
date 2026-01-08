import posthog from 'posthog-js';
import { useCallback } from 'react';

export const useAnalytics = () => {
    const track = useCallback((eventName: string, properties?: Record<string, any>) => {
        if (import.meta.env.VITE_POSTHOG_KEY) {
            posthog.capture(eventName, properties);
        } else {
            console.log(`[Analytics] Track: ${eventName}`, properties);
        }
    }, []);

    const identify = useCallback((userId: string, traits?: Record<string, any>) => {
        if (import.meta.env.VITE_POSTHOG_KEY) {
            posthog.identify(userId, traits);
        } else {
            console.log(`[Analytics] Identify: ${userId}`, traits);
        }
    }, []);

    const pageView = useCallback((url: string, properties?: Record<string, any>) => {
        if (import.meta.env.VITE_POSTHOG_KEY) {
            posthog.capture('$pageview', {
                $current_url: url,
                ...properties
            });
        } else {
            console.log(`[Analytics] PageView: ${url}`, properties);
        }
    }, []);

    return { track, identify, pageView };
};
