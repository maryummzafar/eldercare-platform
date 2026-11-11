package com.eldercare_platform;

import com.eldercare_platform.service.EmailService;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;

import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Replaces real email with an inbox tests can read codes out of. */
@TestConfiguration
public class CapturingEmailConfig {

    public record Sent(String to, String subject, String body) {}

    public static class Inbox implements EmailService {
        private static final Pattern CODE = Pattern.compile("\\b(\\d{6})\\b");
        private final List<Sent> sent = new CopyOnWriteArrayList<>();

        @Override
        public void send(String to, String subject, String body) {
            sent.add(new Sent(to, subject, body));
        }

        /** The six-digit code from the newest email to this address. */
        public String latestCode(String to) {
            for (int i = sent.size() - 1; i >= 0; i--) {
                Sent mail = sent.get(i);
                if (mail.to().equalsIgnoreCase(to)) {
                    Matcher m = CODE.matcher(mail.body());
                    if (m.find()) return m.group(1);
                }
            }
            throw new AssertionError("No code was emailed to " + to);
        }

        public long countTo(String to) {
            return sent.stream().filter(m -> m.to().equalsIgnoreCase(to)).count();
        }

        public String latestSubject(String to) {
            return latest(to).subject();
        }

        public String latestBody(String to) {
            return latest(to).body();
        }

        private Sent latest(String to) {
            for (int i = sent.size() - 1; i >= 0; i--) {
                Sent mail = sent.get(i);
                if (mail.to().equalsIgnoreCase(to)) return mail;
            }
            throw new AssertionError("No email was sent to " + to);
        }
    }

    @Bean
    @Primary
    Inbox inbox() {
        return new Inbox();
    }
}
