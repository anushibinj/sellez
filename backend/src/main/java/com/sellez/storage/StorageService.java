package com.sellez.storage;

import com.sellez.common.ApiException;
import com.sellez.config.SellezProperties;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Set;
import java.util.UUID;

@Service
public class StorageService {
    private static final Set<String> ALLOWED = Set.of("image/jpeg", "image/png", "image/webp", "image/gif");
    private final SellezProperties properties;

    public StorageService(SellezProperties properties) {
        this.properties = properties;
    }

    public String store(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw ApiException.badRequest("An image is required.");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED.contains(contentType)) {
            throw ApiException.badRequest("Only JPEG, PNG, WebP, or GIF images are allowed.");
        }
        try {
            byte[] bytes = file.getBytes();
            if (!hasMagic(bytes, contentType)) {
                throw ApiException.badRequest("Image content does not match its type.");
            }
            String ext = switch (contentType) {
                case "image/png" -> "png";
                case "image/webp" -> "webp";
                case "image/gif" -> "gif";
                default -> "jpg";
            };
            String key = UUID.randomUUID() + "." + ext;
            Path dir = Path.of(properties.getStorage().getLocalPath());
            Files.createDirectories(dir);
            Files.write(dir.resolve(key), bytes);
            return key;
        } catch (IOException e) {
            throw ApiException.badRequest("Could not store image.");
        }
    }

    public Path resolve(String key) {
        if (key == null || key.contains("..") || key.contains("/") || key.contains("\\")) {
            throw ApiException.notFound("File not found.");
        }
        return Path.of(properties.getStorage().getLocalPath()).resolve(key);
    }

    public String publicUrl(String key) {
        if (key == null) {
            return null;
        }
        String base = properties.getStorage().getPublicBaseUrl();
        if (base.endsWith("/")) {
            return base + key;
        }
        return base + "/" + key;
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
