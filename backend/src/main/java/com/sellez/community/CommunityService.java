package com.sellez.community;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CommunityService {
    private final CommunityRepository communities;

    public CommunityService(CommunityRepository communities) {
        this.communities = communities;
    }

    @Transactional
    public Community findOrCreate(String email) {
        String domain = domainOf(email);
        return communities.findByDomain(domain).orElseGet(() -> {
            Community community = new Community();
            community.setDomain(domain);
            community.setDisplayName(displayName(domain));
            return communities.save(community);
        });
    }

    public static String domainOf(String email) {
        int at = email.lastIndexOf('@');
        if (at < 1 || at == email.length() - 1) {
            throw com.sellez.common.ApiException.badRequest("Enter a valid work or school email.");
        }
        return email.substring(at + 1).toLowerCase();
    }

    static String displayName(String domain) {
        String first = domain.split("\\.")[0];
        if (first.isBlank()) {
            return domain;
        }
        return Character.toUpperCase(first.charAt(0)) + first.substring(1);
    }
}
