package com.sellez.email;

public interface NotificationService {
    void sendOtp(String email, String code);
    void listingApproved(String email, String title);
    void listingRejected(String email, String title, String reason);
    void listingReturned(String email, String title, String reason);
    void listingTakenDown(String email, String title, String priceLabel, String reason);
    void newChat(String email, String listingTitle);
    void newReply(String email, String listingTitle);
    void itemSold(String email, String listingTitle);
    void banned(String email, String until, String type);
    void banExpired(String email);
    void appealResolved(String email, String status, String note);
}
