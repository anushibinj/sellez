package com.sellez.storage;

import com.sellez.config.SellezProperties;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

/** Writes files to a directory on local disk, served back out by {@link MediaController}. */
public class LocalStorageBackend implements StorageBackend {
    private final SellezProperties properties;

    public LocalStorageBackend(SellezProperties properties) {
        this.properties = properties;
    }

    @Override
    public String write(byte[] content, String extension) throws IOException {
        String key = UUID.randomUUID() + "." + extension;
        Path dir = Path.of(properties.getStorage().getLocalPath());
        Files.createDirectories(dir);
        Files.write(dir.resolve(key), content);
        return key;
    }

    @Override
    public String publicUrl(String key) {
        if (key == null) {
            return null;
        }
        String base = properties.getStorage().getPublicBaseUrl();
        return (base.endsWith("/") ? base : base + "/") + key;
    }

    /** Only meaningful for this backend — resolves a key to the on-disk path {@link MediaController} serves. */
    Path resolve(String key) {
        return Path.of(properties.getStorage().getLocalPath()).resolve(key);
    }
}
