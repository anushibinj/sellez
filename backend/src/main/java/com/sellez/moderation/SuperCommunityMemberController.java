package com.sellez.moderation;

import com.sellez.security.AuthSupport;
import com.sellez.user.UserAccountRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/super/communities")
public class SuperCommunityMemberController {
    private final UserAccountRepository users;
    private final BanService banService;

    public SuperCommunityMemberController(UserAccountRepository users, BanService banService) {
        this.users = users;
        this.banService = banService;
    }

    @GetMapping("/{id}/members")
    public List<AdminService.MemberView> members(@PathVariable UUID id) {
        var principal = AuthSupport.requireUser();
        banService.requireSuperAdmin(principal);
        return users.findByCommunityId(id).stream()
                .map(u -> new AdminService.MemberView(u.getId(), u.getAlias(), u.getAvatarColor(), u.getRole().name(), u.getRatingAvg(), u.getRatingCount()))
                .toList();
    }
}
