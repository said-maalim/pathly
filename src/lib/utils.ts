/**
 * Shared Utility Functions
 */

/**
 * Capitalize the first letter of a string.
 * e.g. "active" → "Active"
 */
export function capitalize(value: string | null | undefined): string {
    if (!value) return 'Not set';
    return value.charAt(0).toUpperCase() + value.slice(1);
}

/**
 * Format an ISO date string to a human-readable short date.
 * e.g. "2026-03-12T..." → "Mar 12, 2026"
 */
export function formatDate(isoString: string | null | undefined): string {
    if (!isoString) return 'Not set';
    return new Date(isoString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

/**
 * Calculate the number of calendar days between now and a future date.
 * Returns null if the date is invalid.
 */
export function daysUntil(isoString: string | null | undefined): number | null {
    if (!isoString) return null;
    const target = new Date(isoString);
    if (isNaN(target.getTime())) return null;
    const now = new Date();
    const diff = Math.floor((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
}

/**
 * Get user initials from a full name string.
 * e.g. "John Doe" → "JD"
 */
export function getInitials(name: string): string {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}
