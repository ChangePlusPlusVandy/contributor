import { useCallback, useEffect, useState } from "react";
import { useApi } from "@/lib/api";

export type Announcement = {
    id: string;
    content: string;
    createdAt: number;
};

type MakeRequest = (endpoint: string, options?: object) => Promise<any>;

/**
 * Holds the in-flight promise so concurrent callers share one request, and
 * discards it if the load fails so the next caller retries. Lives for the
 * lifetime of the page: a reload starts over with fresh data.
 */
function createCache<T>(load: (makeRequest: MakeRequest) => Promise<T>) {
    let pending: Promise<T> | null = null;
    let value: T | undefined = undefined;

    return {
        peek: () => value,
        set: (next: T) => {
            value = next;
            pending = Promise.resolve(next);
        },
        get: (makeRequest: MakeRequest) => {
            if (!pending) {
                pending = load(makeRequest);
                pending.then(
                    (result) => { value = result; },
                    () => { pending = null; }
                );
            }
            return pending;
        },
    };
}

const resourcesCache = createCache<Resource[]>(async (makeRequest) => {
    const result = await makeRequest("resources/", { method: "GET" });
    if (result.error != null) throw new Error(result.error);
    const raw = result.resources;
    return Array.isArray(raw)
        ? raw.filter((r: unknown): r is Resource => r != null && typeof r === "object")
        : [];
});

const announcementsCache = createCache<Announcement[]>(async (makeRequest) => {
    const result = await makeRequest("announcements/getAll");
    if (result.error != null) throw new Error(result.error);
    const raw = result.announcements;
    return Array.isArray(raw)
        ? raw.map((a: { id: string; content: string; created_at: string }) => ({
            id: a.id,
            content: a.content,
            createdAt: new Date(a.created_at).getTime(),
        }))
        : [];
});

/** `undefined` while the first load is in flight; `[]` once loaded empty or failed. */
function useCached<T>(cache: ReturnType<typeof createCache<T>>, empty: T) {
    const { makeRequest } = useApi();
    const [value, setValue] = useState<T | undefined>(cache.peek);

    useEffect(() => {
        if (value !== undefined) return;
        let cancelled = false;
        cache.get(makeRequest).then(
            (result) => { if (!cancelled) setValue(result); },
            () => { if (!cancelled) setValue(empty); }
        );
        return () => { cancelled = true; };
    }, [value]);

    return [value, setValue] as const;
}

/** Every active resource, fetched once per page load and shared by all callers. */
export function useResources() {
    const [resources] = useCached(resourcesCache, [] as Resource[]);
    return resources;
}

export function useAnnouncements() {
    const [announcements, setAnnouncements] = useCached(announcementsCache, [] as Announcement[]);

    const addAnnouncement = useCallback((item: Announcement) => {
        const next = [...(announcementsCache.peek() ?? []), item];
        announcementsCache.set(next);
        setAnnouncements(next);
    }, []);

    return { announcements, addAnnouncement };
}
