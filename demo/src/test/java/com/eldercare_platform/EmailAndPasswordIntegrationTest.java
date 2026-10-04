package com.eldercare_platform;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Email confirmation at signup, and resetting a forgotten password by emailed code. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(CapturingEmailConfig.class)
@Transactional
class EmailAndPasswordIntegrationTest {

    private static final String PASSWORD = "password123";

    @Autowired
    private MockMvc mvc;

    @Autowired
    private ObjectMapper json;

    @Autowired
    private CapturingEmailConfig.Inbox inbox;

    @Test
    void anElderMustConfirmTheirEmailBeforeBooking() throws Exception {
        Account elder = register("Esha Elder", "esha@test.local", "ELDER");
        Account helper = register("Hari Helper", "hari@test.local", "HELPER");
        confirm(helper);
        publishAndApprove(helper);

        // Signup emails a code and says the address is not yet confirmed.
        assertThat(inbox.countTo("esha@test.local")).isEqualTo(1);
        mvc.perform(get("/api/account/me").header("Authorization", "Bearer " + elder.token))
                .andExpect(jsonPath("$.emailVerified").value(false));

        book(elder, helper).andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value(containsString("confirm your email")));

        verifyEmail(elder, wrong(inbox.latestCode("esha@test.local")))
                .andExpect(status().isBadRequest());
        verifyEmail(elder, inbox.latestCode("esha@test.local"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.emailVerified").value(true));

        book(elder, helper).andExpect(status().isCreated());
    }

    @Test
    void fiveWrongGuessesBurnTheCode() throws Exception {
        Account user = register("Gita Guess", "gita@test.local", "ELDER");
        String code = inbox.latestCode("gita@test.local");

        for (int i = 0; i < 4; i++) {
            verifyEmail(user, wrong(code)).andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value(containsString("not right")));
        }
        verifyEmail(user, wrong(code)).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("Too many")));

        // Even the right code is useless now; a new one has to be requested.
        verifyEmail(user, code).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("expired")));
    }

    @Test
    void aNewCodeCanBeRequestedAtMostOnceAMinute() throws Exception {
        Account user = register("Ravi Resend", "ravi@test.local", "ELDER");

        mvc.perform(post("/api/account/verify-email/resend").header("Authorization", "Bearer " + user.token))
                .andExpect(status().isTooManyRequests());
        assertThat(inbox.countTo("ravi@test.local")).isEqualTo(1);
    }

    @Test
    void anAdminCannotApproveAHelperWhoseEmailIsUnconfirmed() throws Exception {
        Account helper = register("Uma Unconfirmed", "uma@test.local", "HELPER");
        publish(helper);

        mvc.perform(get("/api/admin/helpers").header("Authorization", "Bearer " + admin()))
                .andExpect(jsonPath("$.content[?(@.helperId == " + helper.id + ")].emailVerified").value(false));
        mvc.perform(post("/api/admin/helpers/" + helper.id + "/verification")
                        .header("Authorization", "Bearer " + admin()).param("verified", "true"))
                .andExpect(status().isConflict());
    }

    @Test
    void aForgottenPasswordIsResetByEmailedCodeAndOtherDevicesAreSignedOut() throws Exception {
        Account user = register("Farah Forgetful", "farah@test.local", "ELDER");
        confirm(user);
        long emailsBefore = inbox.countTo("farah@test.local");

        // An unknown address gets the same answer and no email, so accounts cannot be probed.
        forgot("nobody@test.local").andExpect(status().isAccepted());
        assertThat(inbox.countTo("nobody@test.local")).isZero();

        forgot("Farah@Test.Local").andExpect(status().isAccepted());
        assertThat(inbox.countTo("farah@test.local")).isEqualTo(emailsBefore + 1);
        String code = inbox.latestCode("farah@test.local");

        // The token already on this "other device" was issued in an earlier second than
        // the reset, which is the precision the check works at.
        Thread.sleep(1100);

        reset("farah@test.local", wrong(code), "brand-new-password").andExpect(status().isBadRequest());
        String body = reset("farah@test.local", code, "brand-new-password")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists())
                .andReturn().getResponse().getContentAsString();
        String freshToken = json.readTree(body).get("token").asText();

        // The code works once.
        reset("farah@test.local", code, "another-password").andExpect(status().isBadRequest());

        login("farah@test.local", PASSWORD).andExpect(status().isUnauthorized());
        login("farah@test.local", "brand-new-password").andExpect(status().isOk());

        mvc.perform(get("/api/account/me").header("Authorization", "Bearer " + user.token))
                .andExpect(status().isUnauthorized());
        mvc.perform(get("/api/account/me").header("Authorization", "Bearer " + freshToken))
                .andExpect(status().isOk());
    }

    // --- helpers ------------------------------------------------------------------

    private record Account(String token, long id, String email) {}

    private Account register(String name, String email, String role) throws Exception {
        String body = mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of(
                                "name", name, "email", email, "password", PASSWORD, "role", role))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.emailVerified").value(false))
                .andReturn().getResponse().getContentAsString();
        var node = json.readTree(body);
        return new Account(node.get("token").asText(), node.get("userId").asLong(), email);
    }

    private void confirm(Account account) throws Exception {
        verifyEmail(account, inbox.latestCode(account.email)).andExpect(status().isOk());
    }

    private ResultActions verifyEmail(Account account, String code) throws Exception {
        return mvc.perform(post("/api/account/verify-email").header("Authorization", "Bearer " + account.token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(Map.of("code", code))));
    }

    private ResultActions forgot(String email) throws Exception {
        return mvc.perform(post("/api/auth/password/forgot").contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(Map.of("email", email))));
    }

    private ResultActions reset(String email, String code, String newPassword) throws Exception {
        return mvc.perform(post("/api/auth/password/reset").contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(Map.of("email", email, "code", code, "newPassword", newPassword))));
    }

    private ResultActions login(String email, String password) throws Exception {
        return mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(Map.of("email", email, "password", password))));
    }

    private String admin() throws Exception {
        String body = login("admin@test.local", "admin-test-password").andReturn().getResponse().getContentAsString();
        return json.readTree(body).get("token").asText();
    }

    private void publish(Account helper) throws Exception {
        mvc.perform(put("/api/helpers/me").header("Authorization", "Bearer " + helper.token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of(
                                "hourlyRate", 300, "city", "Pune", "offeredServices", new String[]{"COMPANIONSHIP"}))))
                .andExpect(status().isOk());
    }

    private void publishAndApprove(Account helper) throws Exception {
        publish(helper);
        mvc.perform(post("/api/admin/helpers/" + helper.id + "/verification")
                        .header("Authorization", "Bearer " + admin()).param("verified", "true"))
                .andExpect(status().isOk());
    }

    private ResultActions book(Account elder, Account helper) throws Exception {
        Instant start = Instant.now().plus(1, ChronoUnit.DAYS);
        return mvc.perform(post("/api/bookings").header("Authorization", "Bearer " + elder.token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(Map.of(
                        "helperId", helper.id, "serviceType", "COMPANIONSHIP",
                        "scheduledStart", start.toString(),
                        "scheduledEnd", start.plus(2, ChronoUnit.HOURS).toString()))));
    }

    /** A six-digit code guaranteed to differ from the real one. */
    private static String wrong(String code) {
        return code.equals("000000") ? "111111" : "000000";
    }
}
