export function getRelativeShortTime(dateString: string | Date): string {
    const date = typeof dateString === "string" ? new Date(dateString) : dateString;
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
        return `${diffInSeconds}s`;
    }
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
        return `${diffInMinutes}m`;
    }
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
        return `${diffInHours}h`;
    }
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
        return `${diffInDays}d`;
    }
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInDays < 30) {
        return `${diffInWeeks}w`;
    }
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInDays < 365) {
        return `${diffInMonths}mo`;
    }
    const diffInYears = Math.floor(diffInDays / 365);
    return `${diffInYears}y`;
}
