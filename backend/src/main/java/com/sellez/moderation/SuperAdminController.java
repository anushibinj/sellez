package com.sellez.moderation;

import com.sellez.security.AuthSupport;
import org.springframework.data.domain.Page;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class SuperAdminController {
    private final SuperAdminService superAdminService;

    public SuperAdminController(SuperAdminService superAdminService) {
        this.superAdminService = superAdminService;
    }

    @GetMapping("/super/dashboard")
    public SuperAdminService.GlobalDashboard dashboard() {
        return superAdminService.dashboard(AuthSupport.requireUser());
    }

    @GetMapping("/super/communities")
    public List<SuperAdminService.CommunityHealth> communities() {
        return superAdminService.communities(AuthSupport.requireUser());
    }

    @PostMapping("/super/communities/{communityId}/admins/{userId}")
    public void promote(@PathVariable UUID communityId, @PathVariable UUID userId) {
        superAdminService.promote(AuthSupport.requireUser(), communityId, userId);
    }

    @DeleteMapping("/super/communities/{communityId}/admins/{userId}")
    public void demote(@PathVariable UUID communityId, @PathVariable UUID userId) {
        superAdminService.demote(AuthSupport.requireUser(), communityId, userId);
    }

    @GetMapping("/super/appeals")
    public List<SuperAdminService.AppealView> appeals() {
        return superAdminService.appeals(AuthSupport.requireUser());
    }

    @PostMapping("/super/appeals/{id}/resolve")
    public SuperAdminService.AppealView resolve(@PathVariable UUID id, @RequestBody SuperAdminService.ResolveRequest body) {
        return superAdminService.resolve(AuthSupport.requireUser(), id, body.approve(), body.note());
    }

    @GetMapping("/super/audit")
    public Page<SuperAdminService.AuditView> audit(
            @RequestParam(required = false) String event,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "30") int size
    ) {
        return superAdminService.audit(AuthSupport.requireUser(), event, page, size);
    }

    @PostMapping(value = "/appeals", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public SuperAdminService.AppealView appeal(
            @RequestPart("message") String message,
            @RequestPart(value = "evidence", required = false) MultipartFile evidence
    ) {
        return superAdminService.createAppeal(AuthSupport.requireUser(), message, evidence);
    }
}
