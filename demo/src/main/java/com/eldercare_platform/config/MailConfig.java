package com.eldercare_platform.config;

import com.eldercare_platform.service.EmailService;
import jakarta.mail.internet.InternetAddress;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSenderImpl;

import java.io.UnsupportedEncodingException;
import java.util.Properties;

/**
 * Picks how email leaves the server.
 *
 * <p>With MAIL_HOST set, mail goes out over SMTP (Gmail, Brevo, SES — any provider).
 * Without it, each message is written to the log instead, so local development and
 * tests need no mail account. That fallback is loud on purpose: a production server
 * left on it would silently never deliver a verification code.
 *
 * <p>Built here from our own {@code app.mail.*} settings rather than Spring Boot's
 * mail auto-configuration, which switches on as soon as a host property exists at
 * all, even an empty one.
 */
@Slf4j
@Configuration
public class MailConfig {

    @Bean
    EmailService emailService(
            @Value("${app.mail.host:}") String host,
            @Value("${app.mail.port:587}") int port,
            @Value("${app.mail.username:}") String username,
            @Value("${app.mail.password:}") String password,
            @Value("${app.mail.from:}") String from,
            @Value("${app.mail.from-name:Eldercare}") String fromName) {

        if (host.isBlank()) {
            log.warn("MAIL_HOST is not set: emails will be written to this log, not sent. "
                    + "Fine for development; set MAIL_* before real users sign up.");
            return (to, subject, body) ->
                    log.info("EMAIL (not sent) to={} subject=\"{}\"\n{}", to, subject, body);
        }

        JavaMailSenderImpl sender = new JavaMailSenderImpl();
        sender.setHost(host);
        sender.setPort(port);
        sender.setUsername(username);
        sender.setPassword(password);
        sender.setDefaultEncoding("UTF-8");
        Properties props = sender.getJavaMailProperties();
        props.put("mail.smtp.auth", String.valueOf(!username.isBlank()));
        props.put("mail.smtp.starttls.enable", "true");
        props.put("mail.smtp.starttls.required", String.valueOf(port == 587));
        // A slow mail server must not hold a signup request open indefinitely.
        props.put("mail.smtp.connectiontimeout", "10000");
        props.put("mail.smtp.timeout", "10000");
        props.put("mail.smtp.writetimeout", "10000");

        String sendAs = displayAddress(from.isBlank() ? username : from, fromName);
        log.info("Sending email through {}:{} as {}", host, port, sendAs);

        return (to, subject, body) -> {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(sendAs);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            sender.send(message);
        };
    }

    /** "Eldercare <hello@example.com>", so inboxes show the app's name rather than a bare address. */
    private static String displayAddress(String address, String name) {
        try {
            return new InternetAddress(address, name, "UTF-8").toString();
        } catch (UnsupportedEncodingException e) {
            return address;
        }
    }
}
