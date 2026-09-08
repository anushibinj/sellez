package com.sellez.storage;

import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;

/**
 * The one public read path for every uploaded image. Whatever backend {@code sellez.storage.type}
 * selects, the bytes are fetched here (authenticated on the backend, for S3/Firebase) and streamed
 * to the browser — the storage bucket itself never needs to be publicly reachable.
 */
@RestController
public class MediaController {
    private final StorageService storageService;

    public MediaController(StorageService storageService) {
        this.storageService = storageService;
    }

    @GetMapping("/api/media/{key}")
    public ResponseEntity<Resource> get(@PathVariable String key) {
        StoredFile file = storageService.read(key);
        return ResponseEntity.ok()
                .contentType(contentType(key, file.contentType()))
                .cacheControl(CacheControl.maxAge(Duration.ofDays(365)).cachePublic())
                .body(new ByteArrayResource(file.content()));
    }

    private static MediaType contentType(String key, String stored) {
        if (stored != null && !stored.isBlank()) {
            try {
                return MediaType.parseMediaType(stored);
            } catch (RuntimeException ignored) {
                // fall through to guessing from the extension
            }
        }
        String name = key.toLowerCase();
        return name.endsWith(".png") ? MediaType.IMAGE_PNG
                : name.endsWith(".gif") ? MediaType.IMAGE_GIF
                : name.endsWith(".webp") ? MediaType.valueOf("image/webp")
                : MediaType.IMAGE_JPEG;
    }
}
