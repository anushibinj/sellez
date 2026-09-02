package com.sellez.email;

import com.sellez.config.SellezProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.ses.SesClient;
import software.amazon.awssdk.services.ses.model.*;
import software.amazon.awssdk.services.sns.SnsClient;
import software.amazon.awssdk.services.sns.model.PublishRequest;

@Service
public class NotificationServiceImpl implements NotificationService {
    private static final Logger log = LoggerFactory.getLogger(NotificationServiceImpl.class);
    private final SellezProperties properties;

    public NotificationServiceImpl(SellezProperties properties) {
        this.properties = properties;
    }

    @Override
    public void sendOtp(String email, String code) {
        send(email, "Your SellEZ sign-in code", html("Sign in to SellEZ",
                "<p>Your one-time code is <strong style=\"letter-spacing:4px;font-size:24px\">" + code + "</strong>.</p>"
                        + "<p>It expires in 10 minutes. Your email is never shared with other members.</p>"));
    }

    @Override
    public void listingApproved(String email, String title) {
        send(email, "Listing approved", html("Your listing is live",
                "<p><strong>" + escape(title) + "</strong> was approved and is now visible to your community.</p>"));
    }

    @Override
    public void listingRejected(String email, String title, String reason) {
        send(email, "Listing rejected", html("Listing not approved",
                "<p><strong>" + escape(title) + "</strong> was rejected.</p><p>Reason: " + escape(reason) + "</p>"));
    }

    @Override
    public void listingReturned(String email, String title, String reason) {
        send(email, "Listing needs changes", html("Please update your listing",
                "<p><strong>" + escape(title) + "</strong> was returned.</p><p>Reason: " + escape(reason) + "</p>"));
    }

    @Override
    public void listingTakenDown(String email, String title, String priceLabel, String reason) {
        send(email, "Listing taken down", html("Your listing was taken down",
                "<p><strong>" + escape(title) + "</strong> (" + escape(priceLabel) + ") was removed by a community admin and is no longer visible.</p>"
                        + "<p>Reason: " + escape(reason) + "</p>"
                        + "<p>You can see this status and reason any time in \"My listings\".</p>"));
    }

    @Override
    public void newChat(String email, String listingTitle) {
        send(email, "New interested buyer", html("Someone is interested",
                "<p>A community member started a private chat about <strong>" + escape(listingTitle) + "</strong>.</p>"
                        + "<p>Identities stay anonymous inside SellEZ.</p>"));
    }

    @Override
    public void newReply(String email, String listingTitle) {
        send(email, "New chat message", html("New reply",
                "<p>You have a new message about <strong>" + escape(listingTitle) + "</strong>.</p>"));
    }

    @Override
    public void itemSold(String email, String listingTitle) {
        send(email, "Item marked sold", html("This item is sold",
                "<p><strong>" + escape(listingTitle) + "</strong> was marked as sold.</p>"));
    }

    @Override
    public void banned(String email, String until, String type) {
        send(email, "Community restriction", html("Temporary restriction",
                "<p>You are restricted from " + escape(type) + " until <strong>" + escape(until) + "</strong>.</p>"
                        + "<p>You can appeal this decision in the app.</p>"));
    }

    @Override
    public void banExpired(String email) {
        send(email, "Restriction lifted", html("You're back in",
                "<p>Your community restriction has expired. You can participate again.</p>"));
    }

    @Override
    public void appealResolved(String email, String status, String note) {
        send(email, "Appeal update", html("Your appeal was reviewed",
                "<p>Status: <strong>" + escape(status) + "</strong></p><p>" + escape(note == null ? "" : note) + "</p>"));
    }

    private void send(String to, String subject, String htmlBody) {
        String provider = properties.getEmail().getProvider();
        if ("ses".equalsIgnoreCase(provider)) {
            sendSes(to, subject, htmlBody);
        } else if ("sns".equalsIgnoreCase(provider)) {
            sendSns(to, subject, htmlBody);
        } else {
            log.info("Email [{}] to={} subject={} body={}", provider, to, subject, htmlBody.replaceAll("\\s+", " "));
        }
    }

    private void sendSes(String to, String subject, String htmlBody) {
        try (SesClient client = SesClient.builder().region(Region.of(properties.getEmail().getAwsRegion())).build()) {
            client.sendEmail(SendEmailRequest.builder()
                    .source(properties.getEmail().getFrom())
                    .destination(Destination.builder().toAddresses(to).build())
                    .message(Message.builder()
                            .subject(Content.builder().data(subject).build())
                            .body(Body.builder().html(Content.builder().data(htmlBody).build()).build())
                            .build())
                    .build());
        }
    }

    private void sendSns(String to, String subject, String htmlBody) {
        String topic = properties.getEmail().getSnsTopicArn();
        String payload = "{\"to\":\"" + to + "\",\"subject\":\"" + subject.replace("\"", "'") + "\",\"html\":true}";
        try (SnsClient client = SnsClient.builder().region(Region.of(properties.getEmail().getAwsRegion())).build()) {
            client.publish(PublishRequest.builder().topicArn(topic).subject(subject).message(payload + htmlBody).build());
        }
        log.debug("Published SNS email event for {}", to);
    }

    private String html(String title, String inner) {
        return "<!doctype html><html><body style=\"font-family:ui-sans-serif,system-ui,sans-serif;background:#0b0d10;color:#f4f1ea;padding:32px\">"
                + "<div style=\"max-width:520px;margin:auto;background:#15181d;border:1px solid #2a2f36;border-radius:16px;padding:28px\">"
                + "<p style=\"letter-spacing:0.2em;text-transform:uppercase;font-size:12px;color:#9aa38b\">SellEZ</p>"
                + "<h1 style=\"font-size:22px\">" + escape(title) + "</h1>" + inner
                + "<p style=\"color:#9aa38b;font-size:13px;margin-top:28px\">Your identity stays private. Your email is never shared.</p>"
                + "</div></body></html>";
    }

    private String escape(String value) {
        if (value == null) return "";
        return value.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }
}
