package com.sellez.moderation;

import com.sellez.email.NotificationService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Component
public class BanExpiryJob {
    private final BanRepository bans;
    private final NotificationService notifications;

    public BanExpiryJob(BanRepository bans, NotificationService notifications) {
        this.bans = bans;
        this.notifications = notifications;
    }

    @Scheduled(fixedDelayString = "${sellez.jobs.ban-expiry-ms:60000}")
    @Transactional
    public void notifyExpired() {
        bans.findByNotifiedExpiredFalseAndExpiresAtBefore(Instant.now()).forEach(ban -> {
            notifications.banExpired(ban.getUser().getEmail());
            ban.setNotifiedExpired(true);
            bans.save(ban);
        });
    }
}
