package com.sellez.security;

import com.sellez.config.SellezProperties;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
public class CookieService {
    private final SellezProperties properties;

    public CookieService(SellezProperties properties) {
        this.properties = properties;
    }

    public void setAuthCookies(HttpServletResponse response, String accessToken, String refreshToken) {
        SellezProperties.Security sec = properties.getSecurity();
        add(response, build(sec.getAccessCookieName(), accessToken, Duration.ofMinutes(sec.getAccessTokenMinutes())));
        add(response, build(sec.getRefreshCookieName(), refreshToken, Duration.ofDays(sec.getRefreshTokenDays())));
    }

    public void clearAuthCookies(HttpServletResponse response) {
        SellezProperties.Security sec = properties.getSecurity();
        add(response, build(sec.getAccessCookieName(), "", Duration.ZERO));
        add(response, build(sec.getRefreshCookieName(), "", Duration.ZERO));
    }

    public String read(Cookie[] cookies, String name) {
        if (cookies == null) {
            return null;
        }
        for (Cookie cookie : cookies) {
            if (name.equals(cookie.getName())) {
                return cookie.getValue();
            }
        }
        return null;
    }

    private ResponseCookie build(String name, String value, Duration maxAge) {
        SellezProperties.Security sec = properties.getSecurity();
        ResponseCookie.ResponseCookieBuilder builder = ResponseCookie.from(name, value)
                .httpOnly(true)
                .secure(sec.isCookieSecure())
                .sameSite(sec.getCookieSamesite())
                .path("/")
                .maxAge(maxAge);
        if (sec.getCookieDomain() != null && !sec.getCookieDomain().isBlank()) {
            builder.domain(sec.getCookieDomain());
        }
        return builder.build();
    }

    private void add(HttpServletResponse response, ResponseCookie cookie) {
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }
}
