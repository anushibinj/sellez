package com.sellez.listing;

import com.sellez.security.AuthSupport;
import com.sellez.security.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/listings")
public class ListingController {
    private final ListingService listingService;
    private final ListingService.ChatBridge chatBridge;

    public ListingController(ListingService listingService, ListingService.ChatBridge chatBridge) {
        this.listingService = listingService;
        this.chatBridge = chatBridge;
    }

    @GetMapping
    public Page<ListingService.ListingCard> browse(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) List<ListingCategory> categories,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false, defaultValue = "newest") String sort,
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "20") int size
    ) {
        return listingService.browse(AuthSupport.requireUser(), q, categories, minPrice, maxPrice, sort, page, size);
    }

    @GetMapping("/mine")
    public List<ListingService.ListingResponse> mine() {
        return listingService.mine(AuthSupport.requireUser());
    }

    @GetMapping("/currencies")
    public ListingService.CurrencyOptions currencies() {
        AuthSupport.requireUser();
        return listingService.currencyOptions();
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ListingService.ListingResponse create(
            @RequestPart("listing") @Valid ListingService.ListingUpsertRequest listing,
            @RequestPart(value = "images", required = false) List<MultipartFile> images
    ) {
        return listingService.create(AuthSupport.requireUser(), listing, images);
    }

    @GetMapping("/{publicId}")
    public ListingService.ListingResponse get(@PathVariable String publicId) {
        return listingService.get(AuthSupport.requireUser(), publicId);
    }

    @PatchMapping(value = "/{publicId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ListingService.ListingResponse update(
            @PathVariable String publicId,
            @RequestPart("listing") @Valid ListingService.ListingUpsertRequest listing,
            @RequestPart(value = "images", required = false) List<MultipartFile> images
    ) {
        return listingService.update(AuthSupport.requireUser(), publicId, listing, images);
    }

    @PostMapping("/{publicId}/submit")
    public ListingService.ListingResponse submit(@PathVariable String publicId) {
        return listingService.submit(AuthSupport.requireUser(), publicId);
    }

    @PostMapping("/{publicId}/revoke")
    public ListingService.ListingResponse revoke(@PathVariable String publicId) {
        return listingService.revoke(AuthSupport.requireUser(), publicId);
    }

    @PostMapping("/{publicId}/sold")
    public ListingService.ListingResponse sold(@PathVariable String publicId) {
        UserPrincipal user = AuthSupport.requireUser();
        return listingService.markSold(user, publicId, chatBridge);
    }
}
