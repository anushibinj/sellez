package com.sellez.rating;

import com.sellez.security.AuthSupport;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ratings")
public class RatingController {
    private final RatingService ratingService;

    public RatingController(RatingService ratingService) {
        this.ratingService = ratingService;
    }

    @PostMapping
    public RatingService.RatingView create(@Valid @RequestBody RatingService.CreateRatingRequest request) {
        return ratingService.create(AuthSupport.requireUser(), request);
    }

    @GetMapping
    public RatingService.RatingView mine(@RequestParam String listingPublicId) {
        return ratingService.mine(AuthSupport.requireUser(), listingPublicId);
    }
}
