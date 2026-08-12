package com.dealerfleet.adapter.in.web;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;

@Configuration
class OpenApiConfig {

    @Bean
    OpenAPI dealerFleetOpenApi() {
        return new OpenAPI().info(new Info()
                .title("DealerFleet API")
                .description("Gestao de veiculos e concessionarias")
                .version("v1"));
    }
}
