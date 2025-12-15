/**
 * GroupManager
 * 
 * Manages group ID generation, persistence, and sharing functionality.
 * Group IDs follow the format: word1-word2-number (e.g., "alpha-beta-42")
 * 
 * Features:
 * - Random group ID generation with word pairs + numbers
 * - localStorage persistence
 * - URL parameter support for group sharing
 * - Clipboard integration for easy sharing
 */

class GroupManager {
    constructor() {
        this.storageKey = 'currentGroupId';
        this.wordList = [
            'alpha', 'beta', 'gamma', 'delta', 'echo', 'fox', 'golf', 'hotel',
            'india', 'jazz', 'kilo', 'lima', 'mike', 'nova', 'oscar', 'papa',
            'quick', 'red', 'star', 'tango', 'ultra', 'victor', 'wolf', 'xray',
            'yellow', 'zero', 'blue', 'fire', 'ice', 'moon', 'sun', 'wave',
            'rock', 'wind', 'sky', 'sea', 'code', 'data', 'tech', 'dev'
        ];
    }

    // Generate random group ID: word1-word2-number
    generateGroupId() {
        const word1 = this.wordList[Math.floor(Math.random() * this.wordList.length)];
        let word2 = this.wordList[Math.floor(Math.random() * this.wordList.length)];
        
        // Ensure word2 is different from word1
        while (word2 === word1) {
            word2 = this.wordList[Math.floor(Math.random() * this.wordList.length)];
        }
        
        const number = Math.floor(Math.random() * 101); // 0-100
        return `${word1}-${word2}-${number}`;
    }

    // Get or create group ID
    getGroupId() {
        let groupId = localStorage.getItem(this.storageKey);
        if (!groupId) {
            groupId = this.generateGroupId();
            this.setGroupId(groupId);
        }
        return groupId;
    }

    // Set group ID
    setGroupId(groupId) {
        const normalized = groupId.trim().toLowerCase();
        localStorage.setItem(this.storageKey, normalized);
        return normalized;
    }

    // Clear group ID (for testing)
    clearGroupId() {
        localStorage.removeItem(this.storageKey);
    }

    // Get group ID from URL parameter
    getGroupIdFromUrl() {
        const params = new URLSearchParams(window.location.search);
        return params.get('group');
    }

    // Initialize group from URL if present
    initFromUrl() {
        const urlGroupId = this.getGroupIdFromUrl();
        if (urlGroupId) {
            this.setGroupId(urlGroupId);
            console.log(`[GroupManager] Initialized from URL: ${urlGroupId}`);
            return urlGroupId;
        }
        return null;
    }

    // Generate shareable URL
    getShareUrl(groupId) {
        const baseUrl = window.location.origin + window.location.pathname;
        return `${baseUrl}?group=${encodeURIComponent(groupId)}`;
    }

    // Share group (copy to clipboard)
    async shareGroup(groupId) {
        if (!groupId) {
            groupId = this.getGroupId();
        }

        const shareUrl = this.getShareUrl(groupId);

        try {
            // Try modern Clipboard API first
            await navigator.clipboard.writeText(shareUrl);
            console.log(`[GroupManager] Link copied: ${shareUrl}`);
            return { success: true, url: shareUrl };
        } catch (err) {
            // Fallback for older browsers or mobile
            console.warn('[GroupManager] Clipboard API failed, using fallback');
            
            // Create temporary textarea
            const textarea = document.createElement('textarea');
            textarea.value = shareUrl;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            
            try {
                const success = document.execCommand('copy');
                document.body.removeChild(textarea);
                
                if (success) {
                    console.log(`[GroupManager] Link copied (fallback): ${shareUrl}`);
                    return { success: true, url: shareUrl };
                } else {
                    console.error('[GroupManager] Copy failed');
                    return { success: false, url: shareUrl, error: 'Copy failed' };
                }
            } catch (err2) {
                document.body.removeChild(textarea);
                console.error('[GroupManager] Fallback copy failed:', err2);
                return { success: false, url: shareUrl, error: err2.message };
            }
        }
    }
}

// Global instance
const groupManager = new GroupManager();
