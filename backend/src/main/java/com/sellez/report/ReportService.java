package com.sellez.report;

import com.sellez.audit.AuditService;
import com.sellez.chat.ChatThread;
import com.sellez.chat.ChatThreadRepository;
import com.sellez.common.ApiException;
import com.sellez.common.TextSanitizer;
import com.sellez.listing.Listing;
import com.sellez.listing.ListingRepository;
import com.sellez.security.UserPrincipal;
import com.sellez.user.UserAccountRepository;
import jakarta.validation.constraints.NotNull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.UUID;

@Service
public class ReportService {
    private final ReportRepository reports;
    private final ListingRepository listings;
    private final ChatThreadRepository chats;
    private final UserAccountRepository users;
    private final AuditService auditService;

    public ReportService(ReportRepository reports, ListingRepository listings, ChatThreadRepository chats,
                         UserAccountRepository users, AuditService auditService) {
        this.reports = reports;
        this.listings = listings;
        this.chats = chats;
        this.users = users;
        this.auditService = auditService;
    }

    @Transactional
    public void create(UserPrincipal principal, CreateReportRequest request) {
        Report report = new Report();
        report.setReporter(users.getReferenceById(principal.getId()));
        report.setReason(request.reason());
        report.setDetails(TextSanitizer.sanitize(request.details()));
        if (request.listingPublicId() != null && !request.listingPublicId().isBlank()) {
            Listing listing = listings.findByPublicId(request.listingPublicId()).orElseThrow(() -> ApiException.notFound("Listing not found."));
            report.setListing(listing);
            report.setReportedUser(listing.getSeller());
        }
        if (request.chatId() != null) {
            ChatThread chat = chats.findDetailedById(request.chatId()).orElseThrow(() -> ApiException.notFound("Chat not found."));
            if (!chat.getBuyer().getId().equals(principal.getId()) && !chat.getSeller().getId().equals(principal.getId())) {
                throw ApiException.forbidden("You are not part of this chat.");
            }
            report.setChat(chat);
            UUID other = chat.getBuyer().getId().equals(principal.getId()) ? chat.getSeller().getId() : chat.getBuyer().getId();
            report.setReportedUser(users.getReferenceById(other));
        }
        if (report.getListing() == null && report.getChat() == null) {
            throw ApiException.badRequest("Choose a listing or chat to report.");
        }
        reports.save(report);
        auditService.log(principal.getId(), principal.getCommunityId(), "REPORT_FILED", "report", report.getId().toString(), Map.of("reason", request.reason().name()));
    }

    public record CreateReportRequest(@NotNull ReportReason reason, String details, String listingPublicId, UUID chatId) {}
}
