package com.eldercare_platform;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(CapturingEmailConfig.class)
@Transactional
class IdentityVerificationIntegrationTest {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private ObjectMapper json;

    @Autowired
    private CapturingEmailConfig.Inbox inbox;

    @Test
    void customerRequestsReviewAndAdminRecordsVideoVerificationDecision() throws Exception {
        String token = registerAndConfirmEmail("Mina Member", "mina@test.local", "ELDER");
        long userId = userId(token);
        long adminMailCount = inbox.countTo("admin@test.local");

        mvc.perform(post("/api/account/identity-verification").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PENDING"));
        assertThat(inbox.countTo("admin@test.local")).isEqualTo(adminMailCount + 1);
        assertThat(inbox.latestSubject("admin@test.local")).contains("identity check requested");
        assertThat(inbox.latestBody("admin@test.local")).doesNotContain("Mina Member", "mina@test.local");
        mvc.perform(post("/api/account/identity-verification").header("Authorization", "Bearer " + token))
                .andExpect(status().isConflict());

        mvc.perform(get("/api/admin/identity-verifications").header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());

        String admin = login("admin@test.local", "admin-test-password");
        long userMailCount = inbox.countTo("mina@test.local");
        mvc.perform(get("/api/admin/identity-verifications").header("Authorization", "Bearer " + admin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].userId").value(userId))
                .andExpect(jsonPath("$.content[0].status").value("PENDING"));

        mvc.perform(post("/api/admin/identity-verifications/" + userId)
                        .header("Authorization", "Bearer " + admin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"NEEDS_REVIEW\",\"note\":\"Please arrange a clearer video call\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("NEEDS_REVIEW"));
        assertThat(inbox.countTo("mina@test.local")).isEqualTo(userMailCount + 1);
        assertThat(inbox.latestBody("mina@test.local")).doesNotContain("Please arrange a clearer video call");

        mvc.perform(get("/api/admin/identity-verifications").param("status", "NEEDS_REVIEW")
                        .header("Authorization", "Bearer " + admin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].userId").value(userId));

        mvc.perform(post("/api/admin/identity-verifications/" + userId)
                        .header("Authorization", "Bearer " + admin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"VERIFIED\",\"note\":\"Live video identity check completed\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.verifiedAt").isNotEmpty());

        mvc.perform(get("/api/account/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.identityVerificationStatus").value("VERIFIED"))
                .andExpect(jsonPath("$.identityVerifiedAt").isNotEmpty());
        assertThat(inbox.countTo("mina@test.local")).isEqualTo(userMailCount + 2);
    }

    private String registerAndConfirmEmail(String name, String email, String role) throws Exception {
        String body = mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of(
                                "name", name,
                                "email", email,
                                "password", "password123",
                                "role", role,
                                "acceptedTerms", true,
                                "confirmedAdult", true))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        JsonNode node = json.readTree(body);
        String token = node.get("token").asText();
        mvc.perform(post("/api/account/verify-email").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("code", inbox.latestCode(email)))))
                .andExpect(status().isOk());
        return token;
    }

    private long userId(String token) throws Exception {
        return json.readTree(mvc.perform(get("/api/account/me").header("Authorization", "Bearer " + token))
                .andReturn().getResponse().getContentAsString()).get("userId").asLong();
    }

    private String login(String email, String password) throws Exception {
        String body = mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("email", email, "password", password))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return json.readTree(body).get("token").asText();
    }
}
