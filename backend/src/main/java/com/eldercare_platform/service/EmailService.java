package com.eldercare_platform.service;

/**
 * Sends one plain-text email. Behind an interface so tests can capture messages
 * instead of sending them.
 */
public interface EmailService {

    void send(String to, String subject, String body);
}
