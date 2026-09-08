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
    public StoredFile read(String key) throws IOException {
        Path path = Path.of(properties.getStorage().getLocalPath()).resolve(key);
        if (!Files.exists(path)) {
            return null;
        }
        return new StoredFile(Files.readAllBytes(path), Files.probeContentType(path));
    }
}
