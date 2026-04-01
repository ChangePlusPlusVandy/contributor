import * as SecureStore from "expo-secure-store";
import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";

const STORAGE_KEY = "wttinbookmarks";

type BookmarksContextType = {
    /** Org names only — full resources are loaded where needed (e.g. bookmarks screen). */
    bookmarkedOrgNames: string[];
    isBookmarked: (org_name: string) => boolean;
    toggleBookmark: (resource: Resource) => void;
};

const BookmarksContext = createContext<BookmarksContextType | null>(null);

/** Reads stored value: current format is `string[]`; migrates legacy `Resource[]` saves. */
function parseStoredOrgNames(raw: string | null): string[] {
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw) as unknown;
        if (!Array.isArray(parsed) || parsed.length === 0) return [];
        const first = parsed[0];
        if (typeof first === "string") {
            return parsed.filter((x): x is string => typeof x === "string" && x.length > 0);
        }
        if (typeof first === "object" && first !== null && "org_name" in first) {
            return (parsed as Resource[])
                .map((r) => r.org_name)
                .filter((name): name is string => typeof name === "string" && name.length > 0);
        }
        return [];
    } catch {
        return [];
    }
}

export const BookmarksProvider = ({ children }: { children: ReactNode }) => {
    const [bookmarkedOrgNames, setBookmarkedOrgNames] = useState<string[]>([]);
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const raw = await SecureStore.getItemAsync(STORAGE_KEY);
                if (!cancelled) setBookmarkedOrgNames(parseStoredOrgNames(raw));
            } finally {
                if (!cancelled) setHydrated(true);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (!hydrated) return;
        SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(bookmarkedOrgNames)).catch(() => {});
    }, [bookmarkedOrgNames, hydrated]);

    const isBookmarked = useCallback(
        (org_name: string) => bookmarkedOrgNames.includes(org_name),
        [bookmarkedOrgNames]
    );

    const toggleBookmark = useCallback((resource: Resource) => {
        const name = resource.org_name;
        setBookmarkedOrgNames((prev) =>
            prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
        );
    }, []);

    return (
        <BookmarksContext.Provider value={{ bookmarkedOrgNames, isBookmarked, toggleBookmark }}>
            {children}
        </BookmarksContext.Provider>
    );
};

export const useBookmarks = () => {
    const ctx = useContext(BookmarksContext);
    if (!ctx) throw Error("Bookmarks context undefined.");
    return ctx;
};
