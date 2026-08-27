package com.eldercare_platform;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Walks the full happy path an elder and a student helper actually take, plus the
 * access-control rules that protect it.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
// Each test rolls back at the end. Without this the tests share one in-memory H2 and
// a helper verified in one test leaks into another test's search results.
@Transactional
class BookingFlowIntegrationTest {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private ObjectMapper json;

    @Test
    void elderCanBookAVerifiedHelperAndBeBilledForTheVisit() throws Exception {
        String elderToken = register("Ruth Elder", "ruth@test.local", "ELDER");
        String helperToken = register("Sam Student", "sam@test.local", "HELPER");
        long helperId = userIdFromRegistration("sam@test.local");

        // Helper publishes a profile.
        mvc.perform(put("/api/helpers/me")
                        .header("Authorization", "Bearer " + helperToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of(
                                "bio", "Nursing student, happy to help with hospital trips.",
                                "hourlyRate", "500.00",
                                "city", "Pune",
                                "offeredServices", new String[]{"HOSPITAL_VISIT", "GROCERY_SHOPPING"}))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hourlyRate").value(500.00));

        // Unverified helpers must not be discoverable.
        mvc.perform(get("/api/helpers").header("Authorization", "Bearer " + elderToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(0));

        // Admin vets them.
        String adminToken = login("admin@test.local", "admin-test-password");
        mvc.perform(post("/api/admin/helpers/" + helperId + "/verification")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("verified", "true"))
                .andExpect(status().isOk());

        // Now they show up in search.
        mvc.perform(get("/api/helpers")
                        .header("Authorization", "Bearer " + elderToken)
                        .param("service", "HOSPITAL_VISIT")
                        .param("maxRate", "600"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].name").value("Sam Student"));

        // Elder books a two-hour hospital trip.
        Instant start = Instant.now().plus(2, ChronoUnit.DAYS);
        Instant end = start.plus(2, ChronoUnit.HOURS);

        String bookingJson = mvc.perform(post("/api/bookings")
                        .header("Authorization", "Bearer " + elderToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of(
                                "helperId", helperId,
                                "serviceType", "HOSPITAL_VISIT",
                                "scheduledStart", start.toString(),
                                "scheduledEnd", end.toString(),
                                "notes", "Cardiology follow-up at 10am."))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("REQUESTED"))
                // 2 hours x 500 = 1000, rate snapshotted at booking time.
                .andExpect(jsonPath("$.estimatedTotal").value(1000.00))
                .andReturn().getResponse().getContentAsString();

        long bookingId = json.readTree(bookingJson).get("id").asLong();

        // Double-booking the same slot is refused.
        mvc.perform(post("/api/bookings")
                        .header("Authorization", "Bearer " + elderToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of(
                                "helperId", helperId,
                                "serviceType", "HOSPITAL_VISIT",
                                "scheduledStart", start.plus(30, ChronoUnit.MINUTES).toString(),
                                "scheduledEnd", end.toString()))))
                .andExpect(status().isConflict());

        // Helper works the booking through to completion.
        mvc.perform(post("/api/bookings/" + bookingId + "/accept")
                        .header("Authorization", "Bearer " + helperToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACCEPTED"));

        mvc.perform(post("/api/bookings/" + bookingId + "/start")
                        .header("Authorization", "Bearer " + helperToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("IN_PROGRESS"));

        mvc.perform(post("/api/bookings/" + bookingId + "/complete")
                        .header("Authorization", "Bearer " + helperToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPLETED"))
                // Visit took seconds, but the one-hour floor applies: 1 x 500.
                .andExpect(jsonPath("$.finalTotal").value(500.00));
    }

    @Test
    void anElderCannotSeeSomeoneElsesBooking() throws Exception {
        String elderToken = register("First Elder", "elder1@test.local", "ELDER");
        String intruderToken = register("Nosy Elder", "elder2@test.local", "ELDER");
        String helperToken = register("Helper Two", "helper2@test.local", "HELPER");
        long helperId = userIdFromRegistration("helper2@test.local");

        mvc.perform(put("/api/helpers/me")
                        .header("Authorization", "Bearer " + helperToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of(
                                "hourlyRate", "300.00",
                                "city", "Pune",
                                "offeredServices", new String[]{"HOUSE_HELP"}))))
                .andExpect(status().isOk());

        String adminToken = login("admin@test.local", "admin-test-password");
        mvc.perform(post("/api/admin/helpers/" + helperId + "/verification")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("verified", "true"))
                .andExpect(status().isOk());

        Instant start = Instant.now().plus(3, ChronoUnit.DAYS);
        String bookingJson = mvc.perform(post("/api/bookings")
                        .header("Authorization", "Bearer " + elderToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of(
                                "helperId", helperId,
                                "serviceType", "HOUSE_HELP",
                                "scheduledStart", start.toString(),
                                "scheduledEnd", start.plus(1, ChronoUnit.HOURS).toString()))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        long bookingId = json.readTree(bookingJson).get("id").asLong();

        mvc.perform(get("/api/bookings/" + bookingId)
                        .header("Authorization", "Bearer " + intruderToken))
                .andExpect(status().isNotFound());
    }

    @Test
    void protectedEndpointsRejectMissingAndJunkTokens() throws Exception {
        mvc.perform(get("/api/bookings")).andExpect(status().isUnauthorized());

        mvc.perform(get("/api/bookings").header("Authorization", "Bearer not-a-real-token"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void registrationRejectsDuplicateEmailsAndSelfMadeAdmins() throws Exception {
        register("Original", "dupe@test.local", "ELDER");

        mvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of(
                                "name", "Impostor",
                                "email", "dupe@test.local",
                                "password", "another-password",
                                "role", "ELDER"))))
                .andExpect(status().isConflict());

        mvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of(
                                "name", "Sneaky",
                                "email", "sneaky@test.local",
                                "password", "password123",
                                "role", "ADMIN"))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void registrationRejectsWeakPasswordsAndBadEmails() throws Exception {
        mvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of(
                                "name", "Too Short",
                                "email", "not-an-email",
                                "password", "abc",
                                "role", "ELDER"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.email").exists())
                .andExpect(jsonPath("$.fieldErrors.password").exists());
    }

    // --- helpers -------------------------------------------------------------

    private String register(String name, String email, String role) throws Exception {
        String body = mvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of(
                                "name", name,
                                "email", email,
                                "password", "correct-horse-battery",
                                "role", role))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        JsonNode node = json.readTree(body);
        assertThat(node.get("token").asText()).isNotBlank();
        registeredIds.put(email, node.get("userId").asLong());
        return node.get("token").asText();
    }

    private String login(String email, String password) throws Exception {
        String body = mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of(
                                "email", email,
                                "password", password))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        return json.readTree(body).get("token").asText();
    }

    private final Map<String, Long> registeredIds = new java.util.HashMap<>();

    private long userIdFromRegistration(String email) {
        return registeredIds.get(email);
    }
}
