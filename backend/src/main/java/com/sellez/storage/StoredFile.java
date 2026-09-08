package com.sellez.storage;

/**
 * The raw bytes of a stored object plus whatever content type the backend recorded for it
 * (may be null — {@link MediaController} falls back to guessing from the key's extension).
 */
public record StoredFile(byte[] content, String contentType) {
}
