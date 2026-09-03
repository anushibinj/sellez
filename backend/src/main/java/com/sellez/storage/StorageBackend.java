package com.sellez.storage;

import java.io.IOException;

/**
 * A place to persist already-validated, already-compressed file bytes under a generated key, and
 * to turn that key back into a URL a browser can load directly. Swappable via {@code sellez.storage.type}
 * (see {@link StorageConfig}) without any caller needing to know which one is active.
 */
public interface StorageBackend {
    String write(byte[] content, String extension) throws IOException;

    String publicUrl(String key);
}
