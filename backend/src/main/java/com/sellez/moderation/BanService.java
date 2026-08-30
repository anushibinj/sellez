package com.sellez.moderation;

import com.sellez.common.ApiException;
import com.sellez.security.UserPrincipal;
import com.sellez.user.UserRole;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Service
public class BanService {
    private final BanRepository bans;

    public BanService(BanRepository bans) {
        this.bans = bans;
    }

    public Optional<Ban> activeBan(UUID userId) {
        return bans.findFirstByUser_IdAndExpiresAtAfterOrderByExpiresAtDesc(userId, Instant.now());
    }

    public void assertCanPost(UUID userId) {
        activeBan(userId).filter(Ban::isBanPosting).ifPresent(ban -> {
            throw ApiException.forbidden("You are temporarily restricted from posting until " + ban.getExpiresAt() + ".");
        });
    }

    public void assertCanChat(UUID userId) {
        activeBan(userId).filter(Ban::isBanChat).ifPresent(ban -> {
            throw ApiException.forbidden("You are temporarily restricted from chatting until " + ban.getExpiresAt() + ".");
        });
    }

    public void requireCommunityAdmin(UserPrincipal principal) {
        if (principal.getRole() != UserRole.COMMUNITY_ADMIN && principal.getRole() != UserRole.SUPER_ADMIN) {
            throw ApiException.forbidden("Community admin access required.");
        }
    }

    public void requireSuperAdmin(UserPrincipal principal) {
        if (principal.getRole() != UserRole.SUPER_ADMIN) {
            throw ApiException.forbidden("Super admin access required.");
        }
    }
}
