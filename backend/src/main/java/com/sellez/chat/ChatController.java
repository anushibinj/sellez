package com.sellez.chat;

import com.sellez.security.AuthSupport;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/chats")
public class ChatController {
    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    @GetMapping
    public List<ChatService.ChatSummary> list() {
        return chatService.list(AuthSupport.requireUser());
    }

    @PostMapping("/start")
    public ChatService.ChatSummary start(@RequestBody ChatService.StartChatRequest request) {
        return chatService.start(AuthSupport.requireUser(), request.listingPublicId());
    }

    @GetMapping("/{id}/messages")
    public List<ChatService.MessageView> messages(@PathVariable UUID id) {
        return chatService.messages(AuthSupport.requireUser(), id);
    }

    @PostMapping(value = "/{id}/messages", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ChatService.MessageView send(
            @PathVariable UUID id,
            @RequestPart(value = "body", required = false) String body,
            @RequestPart(value = "image", required = false) MultipartFile image
    ) {
        return chatService.send(AuthSupport.requireUser(), id, body, image);
    }
}
