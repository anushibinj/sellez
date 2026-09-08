package com.sellez.storage;

import java.io.IOException;

/**
 * A place to persist already-validated, already-compressed file bytes under a generated key, and
 * to read those bytes back. Swappable via {@code sellez.storage.type} (see {@link StorageConfig})
 * without any caller needing to know which one is active.
 *
 * <p>Reads always go back out through {@link MediaController} — the browser never talks to S3 or
 * Firebase directly, so those buckets stay private and any credentials they need live only here.
 */
public interface StorageBackend {
    String write(byte[] content, String extension) throws IOException;

    /** Fetch a stored object's bytes, or {@code null} if no object exists under {@code key}. */
    StoredFile read(String key) throws IOException;
}
