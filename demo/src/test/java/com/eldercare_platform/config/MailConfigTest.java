package com.eldercare_platform.config;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

class MailConfigTest {

    private final MailConfig mailConfig = new MailConfig();

    @Test
    void missingSmtpHostFailsWhenLogOnlySenderIsDisabled() {
        assertThrows(IllegalStateException.class,
                () -> mailConfig.emailService("", 587, "", "", "", "Eldercare", false));
    }

    @Test
    void missingSmtpHostAllowsDevelopmentFallbackWhenEnabled() {
        assertDoesNotThrow(
                () -> mailConfig.emailService("", 587, "", "", "", "Eldercare", true));
    }
}