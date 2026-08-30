package com.sellez.security;

import com.sellez.config.SellezProperties;
import com.sellez.user.UserAccount;
import com.sellez.user.UserAccountRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {
    private final JwtService jwtService;
    private final CookieService cookieService;
    private final SellezProperties properties;
    private final UserAccountRepository users;

    public JwtAuthFilter(JwtService jwtService, CookieService cookieService, SellezProperties properties, UserAccountRepository users) {
        this.jwtService = jwtService;
        this.cookieService = cookieService;
        this.properties = properties;
        this.users = users;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String token = cookieService.read(request.getCookies(), properties.getSecurity().getAccessCookieName());
        if (token != null && !token.isBlank()) {
            try {
                var userId = jwtService.parseUserId(token);
                UserAccount user = users.findWithCommunityById(userId).orElse(null);
                if (user != null) {
                    UserPrincipal principal = new UserPrincipal(user);
                    var auth = new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
                    SecurityContextHolder.getContext().setAuthentication(auth);
                }
            } catch (Exception ignored) {
                SecurityContextHolder.clearContext();
            }
        }
        filterChain.doFilter(request, response);
    }
}
