package com.eldercare_platform.config;

import com.eldercare_platform.enums.UserRole;
import com.eldercare_platform.security.JwtAuthenticationFilter;
import com.eldercare_platform.security.RestAuthenticationEntryPoint;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final AuthenticationProvider authenticationProvider;
    private final RestAuthenticationEntryPoint restAuthenticationEntryPoint;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // Safe to disable: the API is stateless and authenticated by bearer token,
                // not by a cookie the browser would attach automatically.
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/actuator/health").permitAll()
                        // Browsing helpers is open to any signed-in user.
                        .requestMatchers(HttpMethod.GET, "/api/helpers/**").authenticated()
                        // Only a helper may edit their own profile.
                        .requestMatchers("/api/helpers/**").hasRole(UserRole.HELPER.name())
                        .requestMatchers("/api/admin/**").hasRole(UserRole.ADMIN.name())
                        .anyRequest().authenticated()
                )
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint(restAuthenticationEntryPoint)
                        .accessDeniedHandler(restAuthenticationEntryPoint))
                .authenticationProvider(authenticationProvider)
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /**
     * {@link JwtAuthenticationFilter} is a {@code @Component}, so Boot would also register
     * it directly with the servlet container — ahead of the Spring Security chain. That
     * copy runs first, sets the authentication, and then Security's context filter clears
     * it; because OncePerRequestFilter has already flagged the request, the in-chain copy
     * is skipped and every request ends up anonymous (401).
     *
     * <p>Disabling the standalone registration leaves exactly one execution, inside the chain.
     */
    @Bean
    public FilterRegistrationBean<JwtAuthenticationFilter> disableStandaloneJwtFilter(
            JwtAuthenticationFilter filter) {
        FilterRegistrationBean<JwtAuthenticationFilter> registration =
                new FilterRegistrationBean<>(filter);
        registration.setEnabled(false);
        return registration;
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        // Native mobile clients do not send an Origin header, so this matters only for
        // the web dashboard and local tooling. Tighten to real origins before launch.
        config.setAllowedOrigins(List.of("http://localhost:3000", "http://localhost:8081"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
