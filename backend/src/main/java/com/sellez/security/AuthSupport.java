package com.sellez.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public final class AuthSupport {
    private AuthSupport() {}

    public static UserPrincipal requireUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof UserPrincipal principal)) {
            throw com.sellez.common.ApiException.unauthorized("Please sign in.");
        }
        return principal;
    }
}
