package com.sellez.community;

import com.sellez.common.ApiException;
import com.sellez.common.TextSanitizer;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class DomainLogicTest {
    @Test
    void communityComesFromEmailDomain() {
        assertEquals("google.com", CommunityService.domainOf("Alice@Google.com"));
        assertEquals("Google", CommunityService.displayName("google.com"));
        assertThrows(ApiException.class, () -> CommunityService.domainOf("not-an-email"));
    }

    @Test
    void sanitizerStripsHtml() {
        assertEquals("hello", TextSanitizer.sanitize("<b>hello</b>"));
    }
}
