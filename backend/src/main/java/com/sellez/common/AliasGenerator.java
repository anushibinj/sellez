package com.sellez.common;

import java.security.SecureRandom;
import java.util.List;

public final class AliasGenerator {
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final List<String> ADJECTIVES = List.of(
            "Silver", "Quiet", "Amber", "Cedar", "Hidden", "Gentle", "Nimble", "Solar",
            "Velvet", "Iron", "Maple", "Coral", "Misty", "Brave", "Ivory", "Copper"
    );
    private static final List<String> ANIMALS = List.of(
            "Fox", "Otter", "Heron", "Lynx", "Wren", "Puma", "Seal", "Hawk",
            "Deer", "Moth", "Wolf", "Koi", "Badger", "Crane", "Finch", "Bear"
    );
    private static final List<String> COLORS = List.of(
            "#0F766E", "#1D4ED8", "#7C3AED", "#BE123C", "#C2410C", "#047857", "#0369A1", "#4F46E5"
    );

    private AliasGenerator() {}

    public static String alias() {
        return ADJECTIVES.get(RANDOM.nextInt(ADJECTIVES.size())) + " " + ANIMALS.get(RANDOM.nextInt(ANIMALS.size()));
    }

    public static String color() {
        return COLORS.get(RANDOM.nextInt(COLORS.size()));
    }

    public static String publicId() {
        String alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        StringBuilder sb = new StringBuilder(6);
        for (int i = 0; i < 6; i++) {
            sb.append(alphabet.charAt(RANDOM.nextInt(alphabet.length())));
        }
        return sb.toString();
    }

    public static String otp() {
        int value = 100000 + RANDOM.nextInt(900000);
        return String.valueOf(value);
    }
}
