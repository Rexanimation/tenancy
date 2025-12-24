
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Constructs the full URL for a profile picture.
 * If the path is already a full URL, it returns it as is.
 * If it's a relative path, it prepends the API base URL.
 * @param path The profile picture path (e.g., /uploads/profiles/...)
 * @returns Full URL or undefined
 */
export const getProfileImageUrl = (path?: string): string | undefined => {
    if (!path) return undefined;
    if (path.startsWith('http') || path.startsWith('blob:') || path.startsWith('data:')) {
        return path;
    }
    // Remove leading slash if both have it to avoid double slash, though usually fine.
    // Our API_BASE_URL likely doesn't have trailing slash.
    // Our path likely starts with /.
    return `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};
