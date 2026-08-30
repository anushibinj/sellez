package com.sellez;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sellez.listing.ItemCondition;
import com.sellez.listing.ListingCategory;
import com.sellez.listing.ListingService;
import com.sellez.user.UserRole;
import io.zonky.test.db.AutoConfigureEmbeddedDatabase;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockCookie;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.util.Map;

import static org.hamcrest.Matchers.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@AutoConfigureEmbeddedDatabase(type = AutoConfigureEmbeddedDatabase.DatabaseType.POSTGRES)
class ApiFlowTest {

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;

    @Test
    void marketplaceChatModerationAndPrivacy() throws Exception {
        MockCookie owner = login("owner@sellez.local");
        mvc.perform(get("/api/auth/me").cookie(owner))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value(UserRole.SUPER_ADMIN.name()))
                .andExpect(jsonPath("$.community.domain").value("sellez.local"));

        MockCookie alice = login("alice@acme.com");
        MockCookie bob = login("bob@acme.com");
        MockCookie rival = login("eve@other.org");

        mvc.perform(get("/api/auth/me").cookie(alice))
                .andExpect(jsonPath("$.email").value("alice@acme.com"))
                .andExpect(jsonPath("$.alias").isNotEmpty());

        String publicId = createListing(alice);
        mvc.perform(get("/api/listings").cookie(bob))
                .andExpect(jsonPath("$.content", hasSize(0)));

        mvc.perform(post("/api/listings/" + publicId + "/submit").with(csrf()).cookie(alice))
                .andExpect(jsonPath("$.status").value("UNDER_REVIEW"));

        mvc.perform(get("/api/listings/" + publicId).cookie(rival))
                .andExpect(status().isForbidden());

        String meAlice = mvc.perform(get("/api/auth/me").cookie(alice)).andReturn().getResponse().getContentAsString();
        String communityId = mapper.readTree(meAlice).get("community").get("id").asText();
        String aliceId = mapper.readTree(meAlice).get("id").asText();

        mvc.perform(post("/api/super/communities/" + communityId + "/admins/" + aliceId).with(csrf()).cookie(owner))
                .andExpect(status().isOk());

        MockCookie aliceAdmin = login("alice@acme.com");
        mvc.perform(post("/api/admin/listings/" + publicId + "/approve").with(csrf()).cookie(aliceAdmin))
                .andExpect(jsonPath("$.status").value("ACTIVE"));

        mvc.perform(get("/api/listings").cookie(bob))
                .andExpect(jsonPath("$.content[0].publicId").value(publicId))
                .andExpect(jsonPath("$.content[0].sellerAlias").isNotEmpty())
                .andExpect(jsonPath("$..email").doesNotExist());

        mvc.perform(get("/api/listings/" + publicId).cookie(bob))
                .andExpect(jsonPath("$.seller.alias").isNotEmpty())
                .andExpect(jsonPath("$.email").doesNotExist())
                .andExpect(jsonPath("$.seller.email").doesNotExist());

        String chatJson = mvc.perform(post("/api/chats/start").with(csrf()).cookie(bob)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(Map.of("listingPublicId", publicId))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.counterpartLabel").value("Seller"))
                .andReturn().getResponse().getContentAsString();
        String chatId = mapper.readTree(chatJson).get("id").asText();

        MockMultipartFile body = new MockMultipartFile("body", "", "text/plain", "Is this still available?".getBytes());
        mvc.perform(multipart("/api/chats/" + chatId + "/messages").file(body).with(csrf()).cookie(bob))
                .andExpect(jsonPath("$.roleLabel").value("BUYER"))
                .andExpect(jsonPath("$.body").value("Is this still available?"))
                .andExpect(jsonPath("$.email").doesNotExist())
                .andExpect(jsonPath("$.senderId").doesNotExist());

        mvc.perform(post("/api/listings/" + publicId + "/sold").with(csrf()).cookie(aliceAdmin))
                .andExpect(jsonPath("$.status").value("SOLD"));

        mvc.perform(get("/api/chats/" + chatId + "/messages").cookie(bob))
                .andExpect(jsonPath("$[?(@.system==true)].body", hasItem("This item has been marked as SOLD.")));

        mvc.perform(post("/api/ratings").with(csrf()).cookie(bob)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(Map.of("listingPublicId", publicId, "stars", 5, "review", "Smooth meetup"))))
                .andExpect(jsonPath("$.stars").value(5));

        mvc.perform(post("/api/reports").with(csrf()).cookie(bob)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(Map.of("reason", "SPAM", "details", "test", "listingPublicId", publicId))))
                .andExpect(status().isNoContent());

        String bobId = mapper.readTree(mvc.perform(get("/api/auth/me").cookie(bob)).andReturn().getResponse().getContentAsString()).get("id").asText();
        mvc.perform(post("/api/admin/users/" + bobId + "/ban").with(csrf()).cookie(aliceAdmin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(Map.of("type", "BOTH", "days", 2, "reason", "spam"))))
                .andExpect(status().isNoContent());

        mvc.perform(get("/api/auth/me").cookie(login("bob@acme.com")))
                .andExpect(jsonPath("$.ban.banChat").value(true));

        mvc.perform(multipart("/api/appeals")
                        .file(new MockMultipartFile("message", "", "text/plain", "Please reconsider".getBytes()))
                        .with(csrf())
                        .cookie(login("bob@acme.com")))
                .andExpect(jsonPath("$.status").value("PENDING"));

        mvc.perform(get("/api/super/audit").cookie(owner))
                .andExpect(jsonPath("$.content[*].eventType", hasItems("LOGIN", "OTP_VERIFIED", "LISTING_CREATED", "LISTING_APPROVED", "CHAT_STARTED", "LISTING_SOLD", "REPORT_FILED", "BAN", "APPEAL", "ADMIN_PROMOTION")));
    }

    private MockCookie login(String email) throws Exception {
        mvc.perform(post("/api/auth/send-otp").contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(Map.of("email", email))))
                .andExpect(status().isNoContent());
        MvcResult result = mvc.perform(post("/api/auth/verify-otp").contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(Map.of("email", email, "code", "123456"))))
                .andExpect(status().isOk())
                .andReturn();
        return (MockCookie) result.getResponse().getCookie("sellez_access");
    }

    private String createListing(MockCookie cookie) throws Exception {
        ListingService.ListingUpsertRequest payload = new ListingService.ListingUpsertRequest(
                "Desk lamp", "Barely used brass lamp", new BigDecimal("40.00"),
                ListingCategory.HOME, ItemCondition.LIKE_NEW, "Building A");
        MockMultipartFile json = new MockMultipartFile("listing", "listing.json", "application/json", mapper.writeValueAsBytes(payload));
        MockMultipartFile image = new MockMultipartFile("images", "lamp.png", "image/png", png());
        String body = mvc.perform(multipart("/api/listings").file(json).file(image).with(csrf()).cookie(cookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.publicId").isNotEmpty())
                .andReturn().getResponse().getContentAsString();
        return mapper.readTree(body).get("publicId").asText();
    }

    private byte[] png() throws Exception {
        BufferedImage image = new BufferedImage(8, 8, BufferedImage.TYPE_INT_RGB);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        ImageIO.write(image, "png", out);
        return out.toByteArray();
    }
}
