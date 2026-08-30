package com.sellez.security;

import com.sellez.user.UserAccount;
import com.sellez.user.UserRole;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public class UserPrincipal implements UserDetails {
    private final UUID id;
    private final String email;
    private final UUID communityId;
    private final UserRole role;
    private final String alias;
    private final String avatarColor;
    private final boolean onboarded;

    public UserPrincipal(UserAccount user) {
        this.id = user.getId();
        this.email = user.getEmail();
        this.communityId = user.getCommunity().getId();
        this.role = user.getRole();
        this.alias = user.getAlias();
        this.avatarColor = user.getAvatarColor();
        this.onboarded = user.isOnboarded();
    }

    public UUID getId() { return id; }
    public String getEmail() { return email; }
    public UUID getCommunityId() { return communityId; }
    public UserRole getRole() { return role; }
    public String getAlias() { return alias; }
    public String getAvatarColor() { return avatarColor; }
    public boolean isOnboarded() { return onboarded; }

    public boolean isCommunityAdmin() {
        return role == UserRole.COMMUNITY_ADMIN || role == UserRole.SUPER_ADMIN;
    }

    public boolean isSuperAdmin() {
        return role == UserRole.SUPER_ADMIN;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override
    public String getPassword() { return ""; }

    @Override
    public String getUsername() { return email; }

    @Override
    public boolean isAccountNonExpired() { return true; }

    @Override
    public boolean isAccountNonLocked() { return true; }

    @Override
    public boolean isCredentialsNonExpired() { return true; }

    @Override
    public boolean isEnabled() { return true; }
}
