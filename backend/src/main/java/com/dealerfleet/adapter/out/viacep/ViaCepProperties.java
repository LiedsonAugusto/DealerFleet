package com.dealerfleet.adapter.out.viacep;

import java.time.Duration;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "viacep")
record ViaCepProperties(String baseUrl, Duration connectTimeout, Duration readTimeout) {
}
