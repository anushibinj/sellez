package com.sellez.chat;

import com.sellez.audit.AuditService;
import com.sellez.common.ApiException;
import com.sellez.common.TextSanitizer;
import com.sellez.config.SellezProperties;
import com.sellez.email.NotificationService;
import com.sellez.listing.Listing;
import com.sellez.listing.ListingService;
import com.sellez.listing.ListingStatus;
import com.sellez.moderation.BanService;
import com.sellez.security.UserPrincipal;
import com.sellez.storage.StorageService;
import com.sellez.user.UserAccount;
import com.sellez.user.UserAccountRepository;
import org.springframework.context.annotation.Lazy;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class ChatService implements ListingService.ChatBridge {
    private final ChatThreadRepository threads;
    private final ChatMessageRepository messages;
    private final MessageReadRepository reads;
    private final com.sellez.listing.ListingRepository listings;
    private final UserAccountRepository users;
    private final BanService banService;
    private final StorageService storage;
    private final NotificationService notifications;
    private final AuditService auditService;
    private final SellezProperties properties;
    private final SimpMessagingTemplate broker;

    public ChatService(ChatThreadRepository threads, ChatMessageRepository messages, MessageReadRepository reads,
                       com.sellez.listing.ListingRepository listings, UserAccountRepository users, BanService banService,
                       StorageService storage, NotificationService notifications, AuditService auditService,
                       SellezProperties properties, @Lazy SimpMessagingTemplate broker) {
        this.threads = threads;
        this.messages = messages;
        this.reads = reads;
        this.listings = listings;
        this.users = users;
        this.banService = banService;
        this.storage = storage;
        this.notifications = notifications;
        this.auditService = auditService;
        this.properties = properties;
        this.broker = broker;
    }

    @Transactional
    public ChatSummary start(UserPrincipal principal, String listingPublicId) {
        banService.assertCanChat(principal.getId());
        Listing listing = listings.findByPublicId(listingPublicId).orElseThrow(() -> ApiException.notFound("Listing not found."));
        if (!listing.getCommunity().getId().equals(principal.getCommunityId())) {
            throw ApiException.forbidden("This listing belongs to another community.");
        }
        if (listing.getStatus() != ListingStatus.ACTIVE) {
            throw ApiException.badRequest("You can only message about live listings.");
        }
        if (listing.getSeller().getId().equals(principal.getId())) {
            throw ApiException.badRequest("You cannot chat with yourself.");
        }
        ChatThread existing = threads.findByListing_IdAndBuyer_Id(listing.getId(), principal.getId()).orElse(null);
        if (existing != null) {
            return toSummary(existing, principal);
        }
        UserAccount buyer = users.findWithCommunityById(principal.getId()).orElseThrow();
        ChatThread thread = new ChatThread();
        thread.setListing(listing);
        thread.setBuyer(buyer);
        thread.setSeller(listing.getSeller());
        threads.save(thread);
        notifications.newChat(listing.getSeller().getEmail(), listing.getTitle());
        auditService.log(principal.getId(), principal.getCommunityId(), "CHAT_STARTED", "chat", thread.getId().toString(), Map.of("listing", listing.getPublicId()));
        return toSummary(thread, principal);
    }

    @Transactional(readOnly = true)
    public List<ChatSummary> list(UserPrincipal principal) {
        return threads.findInbox(principal.getId())
                .stream().map(t -> toSummary(t, principal)).toList();
    }

    @Transactional
    public List<MessageView> messages(UserPrincipal principal, UUID chatId) {
        ChatThread thread = requireParticipant(principal, chatId);
        List<ChatMessage> list = messages.findByChat_IdOrderByCreatedAtAsc(chatId);
        for (ChatMessage message : list) {
            if (!reads.existsByMessage_IdAndUser_Id(message.getId(), principal.getId())) {
                MessageRead read = new MessageRead();
                read.setMessage(message);
                read.setUser(users.getReferenceById(principal.getId()));
                read.setReadAt(Instant.now());
                reads.save(read);
            }
        }
        return list.stream().map(m -> toMessage(m, principal, thread)).toList();
    }

    @Transactional
    public MessageView send(UserPrincipal principal, UUID chatId, String body, MultipartFile image) {
        banService.assertCanChat(principal.getId());
        ChatThread thread = requireParticipant(principal, chatId);
        if ((body == null || body.isBlank()) && (image == null || image.isEmpty())) {
            throw ApiException.badRequest("Write a message or attach a photo.");
        }
        if (image != null && !image.isEmpty() && image.getSize() > properties.getChat().getMaxImageBytes()) {
            throw ApiException.badRequest("Image is too large.");
        }
        ChatMessage message = new ChatMessage();
        message.setChat(thread);
        message.setSender(users.getReferenceById(principal.getId()));
        message.setBody(TextSanitizer.sanitize(body));
        if (image != null && !image.isEmpty()) {
            message.setImageKey(storage.store(image));
        }
        messages.save(message);
        UUID otherId = thread.getBuyer().getId().equals(principal.getId()) ? thread.getSeller().getId() : thread.getBuyer().getId();
        UserAccount other = users.findWithCommunityById(otherId).orElseThrow();
        notifications.newReply(other.getEmail(), thread.getListing().getTitle());
        MessageView view = toMessage(message, principal, thread);
        broker.convertAndSend("/topic/chats/" + chatId, view);
        return view;
    }

    @Override
    @Transactional
    public void onSold(Listing listing) {
        String text = "This item has been marked as SOLD.";
        for (ChatThread thread : threads.findByListing_Id(listing.getId())) {
            ChatMessage message = new ChatMessage();
            message.setChat(thread);
            message.setSystem(true);
            message.setBody(text);
            messages.save(message);
            MessageView view = new MessageView(message.getId(), "SYSTEM", text, null, true, message.getCreatedAt(), false);
            broker.convertAndSend("/topic/chats/" + thread.getId(), view);
            notifications.itemSold(thread.getBuyer().getEmail(), listing.getTitle());
            notifications.itemSold(thread.getSeller().getEmail(), listing.getTitle());
        }
    }

    private ChatThread requireParticipant(UserPrincipal principal, UUID chatId) {
        ChatThread thread = threads.findDetailedById(chatId).orElseThrow(() -> ApiException.notFound("Chat not found."));
        if (!thread.getBuyer().getId().equals(principal.getId()) && !thread.getSeller().getId().equals(principal.getId())) {
            throw ApiException.forbidden("You are not part of this chat.");
        }
        return thread;
    }

    private ChatSummary toSummary(ChatThread thread, UserPrincipal principal) {
        boolean seller = thread.getSeller().getId().equals(principal.getId());
        return new ChatSummary(
                thread.getId(),
                thread.getListing().getPublicId(),
                thread.getListing().getTitle(),
                seller ? "Interested Buyer" : "Seller",
                seller ? "SELLER" : "BUYER",
                thread.getCreatedAt()
        );
    }

    private MessageView toMessage(ChatMessage message, UserPrincipal principal, ChatThread thread) {
        String role;
        if (message.isSystem() || message.getSender() == null) {
            role = "SYSTEM";
        } else if (message.getSender().getId().equals(thread.getSeller().getId())) {
            role = "SELLER";
        } else {
            role = "BUYER";
        }
        boolean mine = message.getSender() != null && message.getSender().getId().equals(principal.getId());
        return new MessageView(
                message.getId(),
                role,
                message.getBody(),
                storage.publicUrl(message.getImageKey()),
                message.isSystem(),
                message.getCreatedAt(),
                mine
        );
    }

    public record StartChatRequest(String listingPublicId) {}
    public record ChatSummary(UUID id, String listingPublicId, String listingTitle, String counterpartLabel, String myRole, Instant createdAt) {}
    public record MessageView(UUID id, String roleLabel, String body, String imageUrl, boolean system, Instant createdAt, boolean mine) {}
}
