package com.sellez.security;

import com.sellez.config.SellezProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

@Service
public class JwtService {
    private final SellezProperties properties;

    public JwtService(SellezProperties properties) {
        this.properties = properties;
    }

    public String createAccessToken(UUID userId) {
        Instant now = Instant.now();
        Instant exp = now.plusSeconds(properties.getSecurity().getAccessTokenMinutes() * 60);
        return Jwts.builder()
                .subject(userId.toString())
                .issuedAt(Date.from(now))
                .expiration(Date.from(exp))
                .signWith(key())
                .compact();
    }

    public UUID parseUserId(String token) {
        Claims claims = Jwts.parser().verifyWith(key()).build().parseSignedClaims(token).getPayload();
        return UUID.fromString(claims.getSubject());
    }

    private SecretKey key() {
        byte[] bytes = properties.getSecurity().getJwtSecret().getBytes(StandardCharsets.UTF_8);
        if (bytes.length < 32) {
            bytes = java.util.Arrays.copyOf(bytes, 32);
        }
        return Keys.hmacShaKeyFor(bytes);
    }
}
