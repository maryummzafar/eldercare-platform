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
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;

import static org.hamcrest.Matchers.startsWith;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * The behaviour added for the first public release: honest error codes, self-service
 * account deletion (a Play Store requirement) and the admin vetting queue.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(CapturingEmailConfig.class)
@Transactional
class LaunchReadinessIntegrationTest {

    private static final String PASSWORD = "password123";

    @Autowired
    private MockMvc mvc;

    @Autowired
    private ObjectMapper json;

    @Autowired
    private CapturingEmailConfig.Inbox inbox;

    @Test
    void badInputIsA400NotA401() throws Exception {
        String helper = register("Hal Helper", "hal@test.local", "HELPER").token;

        // An unknown enum value used to fall through to /error, which was secured, so the
        // app saw 401 and logged the user out.
        mvc.perform(put("/api/helpers/me").header("Authorization", "Bearer " + helper)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"hourlyRate\":250,\"offeredServices\":[\"NOT_A_SERVICE\"]}"))
                .andExpect(status().isBadRequest());

        // Over-long city used to reach the database and fail there.
        mvc.perform(put("/api/helpers/me").header("Authorization", "Bearer " + helper)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of(
                                "hourlyRate", 250,
                                "city", "x".repeat(300),
                                "offeredServices", new String[]{"TRANSPORT"}))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.city").exists());
    }

    @Test
    void deletingAnAccountErasesTheUserAndCancelsTheirOpenBookings() throws Exception {
        Registered elder = register("Edna Elder", "edna@test.local", "ELDER");
        Registered helper = register("Hugo Helper", "hugo@test.local", "HELPER");
        publishAndVerify(helper);

        long bookingId = book(elder, helper);
        mvc.perform(post("/api/bookings/" + bookingId + "/accept").header("Authorization", "Bearer " + helper.token))
                .andExpect(status().isOk());
        mvc.perform(post("/api/bookings/" + bookingId + "/messages").header("Authorization", "Bearer " + elder.token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"body\":\"My flat is 4B, ring twice.\"}"))
                .andExpect(status().isCreated());

        // A wrong password changes nothing.
        mvc.perform(post("/api/account/delete").header("Authorization", "Bearer " + elder.token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"password\":\"not-my-password\"}"))
                .andExpect(status().isForbidden());

        mvc.perform(post("/api/account/delete").header("Authorization", "Bearer " + elder.token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"password\":\"" + PASSWORD + "\"}"))
                .andExpect(status().isNoContent());

        // The token in the app is dead, and the credentials no longer work.
        mvc.perform(get("/api/bookings").header("Authorization", "Bearer " + elder.token))
                .andExpect(status().isUnauthorized());
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"edna@test.local\",\"password\":\"" + PASSWORD + "\"}"))
                .andExpect(status().isUnauthorized());

        // The helper keeps the record, but cancelled and with nothing identifying left.
        mvc.perform(get("/api/bookings/" + bookingId).header("Authorization", "Bearer " + helper.token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"));
        mvc.perform(get("/api/bookings/" + bookingId + "/messages").header("Authorization", "Bearer " + helper.token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].body").value(startsWith("This message was removed")));
        mvc.perform(get("/api/notifications").header("Authorization", "Bearer " + helper.token))
                .andExpect(jsonPath("$.content[0].type").value("BOOKING_CANCELLED"));

        // The email is free to sign up with again.
        register("Edna Again", "edna@test.local", "ELDER");
    }

    @Test
    void anAccountCannotBeDeletedMidVisit() throws Exception {
        Registered elder = register("Ivy Elder", "ivy@test.local", "ELDER");
        Registered helper = register("Ian Helper", "ian@test.local", "HELPER");
        publishAndVerify(helper);

        long bookingId = book(elder, helper);
        mvc.perform(post("/api/bookings/" + bookingId + "/accept").header("Authorization", "Bearer " + helper.token));
        mvc.perform(post("/api/bookings/" + bookingId + "/start").header("Authorization", "Bearer " + helper.token))
                .andExpect(status().isOk());

        mvc.perform(post("/api/account/delete").header("Authorization", "Bearer " + helper.token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"password\":\"" + PASSWORD + "\"}"))
                .andExpect(status().isConflict());
    }

    @Test
    void adminSeesTheVettingQueueAndApprovedHelpersLeaveIt() throws Exception {
        Registered helper = register("Pat Pending", "pat@test.local", "HELPER");
        publish(helper);
        String admin = login("admin@test.local", "admin-test-password");

        mvc.perform(get("/api/admin/helpers").header("Authorization", "Bearer " + admin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[?(@.helperId == " + helper.id + ")].email").value("pat@test.local"));

        mvc.perform(post("/api/admin/helpers/" + helper.id + "/verification")
                        .header("Authorization", "Bearer " + admin).param("verified", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.verified").value(true));

        mvc.perform(get("/api/admin/helpers").header("Authorization", "Bearer " + admin))
                .andExpect(jsonPath("$.content[?(@.helperId == " + helper.id + ")]").isEmpty());

        // Only admins see contact details.
        mvc.perform(get("/api/admin/helpers").header("Authorization", "Bearer " + helper.token))
                .andExpect(status().isForbidden());
    }

    private record Registered(String token, long id) {}

    private Registered register(String name, String email, String role) throws Exception {
        String body = mvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of(
                                "name", name, "email", email, "password", PASSWORD, "role", role))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        var node = json.readTree(body);
        String token = node.get("token").asText();
        mvc.perform(post("/api/account/verify-email").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("code", inbox.latestCode(email)))))
                .andExpect(status().isOk());
        return new Registered(token, node.get("userId").asLong());
    }

    private String login(String email, String password) throws Exception {
        String body = mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("email", email, "password", password))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return json.readTree(body).get("token").asText();
    }

    private void publish(Registered helper) throws Exception {
        mvc.perform(put("/api/helpers/me").header("Authorization", "Bearer " + helper.token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of(
                                "hourlyRate", 300, "city", "Pune",
                                "offeredServices", new String[]{"COMPANIONSHIP"}))))
                .andExpect(status().isOk());
    }

    private void publishAndVerify(Registered helper) throws Exception {
        publish(helper);
        mvc.perform(post("/api/admin/helpers/" + helper.id + "/verification")
                        .header("Authorization", "Bearer " + login("admin@test.local", "admin-test-password"))
                        .param("verified", "true"))
                .andExpect(status().isOk());
    }

    private long book(Registered elder, Registered helper) throws Exception {
        Instant start = Instant.now().plus(1, ChronoUnit.DAYS);
        String body = mvc.perform(post("/api/bookings").header("Authorization", "Bearer " + elder.token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of(
                                "helperId", helper.id,
                                "serviceType", "COMPANIONSHIP",
                                "scheduledStart", start.toString(),
                                "scheduledEnd", start.plus(2, ChronoUnit.HOURS).toString()))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return json.readTree(body).get("id").asLong();
    }
}
