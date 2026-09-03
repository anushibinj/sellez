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

    @PostMapping("/listings/{publicId}/takedown")
    public AdminService.ListingServiceView takeDown(@PathVariable String publicId, @Valid @RequestBody AdminService.ReasonRequest body) {
        return adminService.takeDown(AuthSupport.requireUser(), publicId, body.reason());
    }

    @PostMapping("/listings/{publicId}/restore")
    public AdminService.ListingServiceView restore(@PathVariable String publicId) {
        return adminService.restore(AuthSupport.requireUser(), publicId);
    }

    @PatchMapping("/listings/{publicId}/category")
    public AdminService.ListingServiceView updateCategory(@PathVariable String publicId, @Valid @RequestBody AdminService.CategoryRequest body) {
        return adminService.updateCategory(AuthSupport.requireUser(), publicId, body.category());
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

    @GetMapping("/listing-appeals")
    public List<AdminService.ListingAppealView> listingAppeals() {
        return adminService.listingAppeals(AuthSupport.requireUser());
    }

    @PostMapping("/listing-appeals/{id}/resolve")
    public AdminService.ListingAppealView resolveListingAppeal(@PathVariable UUID id, @RequestBody AdminService.ResolveListingAppealRequest body) {
        return adminService.resolveListingAppeal(AuthSupport.requireUser(), id, body.approve(), body.note());
    }
}
