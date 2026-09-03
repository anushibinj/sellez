package com.sellez.storage;

import net.coobird.thumbnailator.Thumbnails;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;

/**
 * Re-encodes every uploaded image to a size-capped, quality-tuned JPEG before it's persisted —
 * applied once, here, so every upload path (listing photos, chat images, appeal evidence) is
 * compressed the same way regardless of which {@link StorageBackend} ends up storing the bytes.
 */
final class ImageCompressor {
    private ImageCompressor() {}

    /**
     * @param maxDimension the longest edge is scaled down to this many pixels — never upscaled, so a
     *                      smaller source image is only recompressed, not stretched. 1600px comfortably
     *                      covers a full-width image on any laptop or phone screen (including retina)
     *                      without looking soft, while cutting file size dramatically versus a raw photo.
     * @param quality       JPEG quality from 0 (smallest, worst) to 1 (largest, best); ~0.8 is the usual
     *                      sweet spot where compression artifacts aren't visible at normal viewing sizes.
     */
    static byte[] compress(byte[] original, int maxDimension, float quality) throws IOException {
        BufferedImage image = ImageIO.read(new ByteArrayInputStream(original));
        if (image == null) {
            throw new IOException("Unsupported or corrupt image content.");
        }
        int width = image.getWidth();
        int height = image.getHeight();
        double scale = Math.min(1.0, (double) maxDimension / Math.max(width, height));
        int targetWidth = Math.max(1, (int) Math.round(width * scale));
        int targetHeight = Math.max(1, (int) Math.round(height * scale));

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Thumbnails.of(image)
                .size(targetWidth, targetHeight)
                .outputFormat("jpg")
                .outputQuality(quality)
                .toOutputStream(out);
        return out.toByteArray();
    }
}
