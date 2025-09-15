package com.vinishchoudhary.reviewtracker.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.Arrays;

@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Value("${app.cors.allowed-origins:http://localhost:5173}")
    private String allowedOrigins;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        String[] values = Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toArray(String[]::new);

        // If any value contains a wildcard, use origin patterns for flexibility (e.g., https://*.example.com)
        boolean usePatterns = Arrays.stream(values).anyMatch(v -> v.contains("*")) || Arrays.stream(values).anyMatch("*"::equals);

        var mapping = registry.addMapping("/api/**")
                .allowedMethods("GET","POST","PUT","PATCH","DELETE","OPTIONS")
                .allowedHeaders("*")
                .exposedHeaders("*")
                .allowCredentials(false);

        if (usePatterns) {
            mapping.allowedOriginPatterns(values.length == 0 ? new String[]{"*"} : values);
        } else {
            mapping.allowedOrigins(values);
        }
    }
}
