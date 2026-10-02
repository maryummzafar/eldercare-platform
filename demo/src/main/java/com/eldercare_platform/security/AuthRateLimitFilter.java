package com.eldercare_platform.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Caps login and signup attempts per client address, so the auth endpoints cannot be
 * used to guess passwords at speed or to mass-create accounts.
 *
 * <p>A fixed one-minute window held in memory. That is per instance, which is fine for
 * a single server; once there are several behind a load balancer this moves to a shared
 * store such as Redis. The client address comes from {@code getRemoteAddr()}, which
 * Tomcat resolves from {@code X-Forwarded-For} only when the hop in front of it is a
 * private-network proxy ({@code server.forward-headers-strategy: native}), so a client
 * cannot dodge the limit by sending its own header.
 */
@Component
public class AuthRateLimitFilter extends OncePerRequestFilter {

    private static final long WINDOW_MS = 60_000;
    /** Past this many tracked addresses, expired windows are swept on the next request. */
    private static final int SWEEP_THRESHOLD = 10_000;

    private final int maxPerWindow;
    private final ObjectMapper objectMapper;
    private final Map<String, Window> windows = new ConcurrentHashMap<>();

    public AuthRateLimitFilter(
            @Value("${app.rate-limit.auth-per-minute:10}") int maxPerWindow,
            ObjectMapper objectMapper) {
        this.maxPerWindow = maxPerWindow;
        this.objectMapper = objectMapper;
    }

    @Override
    protected boolean shouldNotFilter(@NonNull HttpServletRequest request) {
        // A browser sends a CORS preflight before each real attempt; counting both would
        // halve the limit for web users only.
        return !request.getRequestURI().startsWith("/api/auth/")
                || "OPTIONS".equals(request.getMethod());
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        long now = System.currentTimeMillis();
        if (windows.size() > SWEEP_THRESHOLD) {
            windows.values().removeIf(w -> now - w.start >= WINDOW_MS);
        }

        Window window = windows.compute(request.getRemoteAddr(), (key, current) ->
                current == null || now - current.start >= WINDOW_MS ? new Window(now) : current);

        if (window.hit() > maxPerWindow) {
            long retryAfterSeconds = Math.max(1, (window.start + WINDOW_MS - now + 999) / 1000);
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setHeader("Retry-After", String.valueOf(retryAfterSeconds));
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);

            Map<String, Object> body = new LinkedHashMap<>();
            body.put("timestamp", Instant.now().toString());
            body.put("status", HttpStatus.TOO_MANY_REQUESTS.value());
            body.put("error", HttpStatus.TOO_MANY_REQUESTS.getReasonPhrase());
            body.put("message", "Too many attempts. Please wait a minute and try again.");
            objectMapper.writeValue(response.getOutputStream(), body);
            return;
        }

        filterChain.doFilter(request, response);
    }

    private static final class Window {
        final long start;
        private int count;

        Window(long start) {
            this.start = start;
        }

        synchronized int hit() {
            return ++count;
        }
    }
}
