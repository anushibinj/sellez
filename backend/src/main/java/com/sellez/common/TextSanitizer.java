package com.sellez.common;

public final class TextSanitizer {
    private TextSanitizer() {}

    public static String sanitize(String input) {
        if (input == null) {
            return null;
        }
        return input.replaceAll("<[^>]*>", "").replace('\u0000', ' ').trim();
    }
}
