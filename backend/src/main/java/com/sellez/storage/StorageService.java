package com.sellez.storage;

import com.sellez.common.ApiException;
import com.sellez.config.SellezProperties;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Set;

@Service
public class StorageService {
    private static final Set<String> ALLOWED = Set.of("image/jpeg", "image/png", "image/webp", "image/gif");
    private final SellezProperties properties;
    private final StorageBackend backend;

    public StorageService(SellezProperties properties, StorageBackend backend) {
        this.properties = properties;
        this.backend = backend;
    }

    public String store(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw ApiException.badRequest("An image is required.");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED.contains(contentType)) {
            throw ApiException.badRequest("Only JPEG, PNG, WebP, or GIF images are allowed.");
        }
        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException e) {
            throw ApiException.badRequest("Could not read the uploaded file.");
        }
        if (!hasMagic(bytes, contentType)) {
            throw ApiException.badRequest("Image content does not match its type.");
        }
        byte[] compressed;
        try {
            // Every upload is recompressed to a size-capped JPEG here, regardless of source format —
            // see ImageCompressor for why — so the backend always receives the same, already-optimized bytes.
            compressed = ImageCompressor.compress(bytes, properties.getStorage().getImageMaxDimension(), properties.getStorage().getImageQuality());
        } catch (IOException e) {
            throw ApiException.badRequest("Could not process image.");
        }
        try {
            return backend.write(compressed, "jpg");
        } catch (ApiException e) {
            throw e;
        } catch (IOException | RuntimeException e) {
            // Whatever shape the active backend's own client throws (an S3/Firebase SDK exception is
            // unchecked, unlike the local disk IOException) — this is an infra problem, not the
            // caller's fault, so it's a 500 rather than the 400s above.
            throw ApiException.serverError("Could not store the image. Please try again.");
        }
    }

    /**
     * Fetch a stored object's bytes from whichever backend is active. The browser hits
     * {@link MediaController} for this — it never talks to S3/Firebase directly — so the bucket
     * can stay private and any credentials it needs live only on the backend.
     */
    public StoredFile read(String key) {
        if (key == null || key.contains("..") || key.contains("/") || key.contains("\\")) {
            throw ApiException.notFound("File not found.");
        }
        StoredFile file;
        try {
            file = backend.read(key);
        } catch (IOException | RuntimeException e) {
            throw ApiException.serverError("Could not read the image. Please try again.");
        }
        if (file == null) {
            throw ApiException.notFound("File not found.");
        }
        return file;
    }

    /** Every backend is served back out through {@link MediaController} at {@code publicBaseUrl/key}. */
    public String publicUrl(String key) {
        if (key == null) {
            return null;
        }
        String base = properties.getStorage().getPublicBaseUrl();
        return (base.endsWith("/") ? base : base + "/") + key;
    }

    private boolean hasMagic(byte[] bytes, String contentType) {
        if (bytes.length < 12) {
            return false;
        }
        return switch (contentType) {
            case "image/jpeg" -> bytes[0] == (byte) 0xFF && bytes[1] == (byte) 0xD8;
            case "image/png" -> bytes[0] == (byte) 0x89 && bytes[1] == 0x50 && bytes[2] == 0x4E && bytes[3] == 0x47;
            case "image/gif" -> bytes[0] == 'G' && bytes[1] == 'I' && bytes[2] == 'F';
            case "image/webp" -> bytes[0] == 'R' && bytes[1] == 'I' && bytes[2] == 'F' && bytes[3] == 'F'
                    && bytes[8] == 'W' && bytes[9] == 'E' && bytes[10] == 'B' && bytes[11] == 'P';
            default -> false;
        };
    }
}
