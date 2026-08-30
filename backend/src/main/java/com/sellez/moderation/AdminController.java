package com.sellez.moderation;

import com.sellez.listing.ListingStatus;
import com.sellez.security.AuthSupport;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
public class AdminController {
    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/dashboard")
    public AdminService.Dashboard dashboard() {
        return adminService.dashboard(AuthSupport.requireUser());
    }

    @GetMapping("/listings")
    public List<AdminService.ListingServiceView> listings(@RequestParam(required = false) ListingStatus status) {
        return adminService.queue(AuthSupport.requireUser(), status);
    }

    @PostMapping("/listings/{publicId}/approve")
    public AdminService.ListingServiceView approve(@PathVariable String publicId) {
        return adminService.approve(AuthSupport.requireUser(), publicId);
    }

    @PostMapping("/listings/{publicId}/reject")
    public AdminService.ListingServiceView reject(@PathVariable String publicId, @Valid @RequestBody AdminService.ReasonRequest body) {
        return adminService.reject(AuthSupport.requireUser(), publicId, body.reason());
    }

    @PostMapping("/listings/{publicId}/return")
    public AdminService.ListingServiceView returnListing(@PathVariable String publicId, @Valid @RequestBody AdminService.ReasonRequest body) {
        return adminService.returnListing(AuthSupport.requireUser(), publicId, body.reason());
    }

    @PostMapping("/users/{id}/ban")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void ban(@PathVariable UUID id, @Valid @RequestBody AdminService.BanRequest body) {
        adminService.ban(AuthSupport.requireUser(), id, body);
    }

    @GetMapping("/users")
    public List<AdminService.MemberView> users() {
        return adminService.members(AuthSupport.requireUser());
    }

    @GetMapping("/reports")
    public List<AdminService.ReportView> reports() {
        return adminService.openReports(AuthSupport.requireUser());
    }
}
