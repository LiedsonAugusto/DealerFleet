package com.dealerfleet.adapter.in.web.vehicle;

import java.math.BigDecimal;
import java.util.UUID;

import com.dealerfleet.domain.vehicle.FuelType;
import com.dealerfleet.domain.vehicle.VehicleSpec;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record VehicleRequest(
        @NotBlank @Size(max = 60) String brand,
        @NotBlank @Size(max = 60) String model,
        @NotNull FuelType fuelType,
        @NotBlank @Size(max = 40) String color,
        Integer year,
        @Size(min = 17, max = 17) String chassis,
        @Positive BigDecimal price,
        @Size(max = 40) String externalColor,
        UUID dealerId) {

    public VehicleSpec toSpec() {
        return VehicleSpec.builder()
                .brand(brand)
                .model(model)
                .fuelType(fuelType)
                .color(color)
                .year(year)
                .chassis(chassis)
                .price(price)
                .externalColor(externalColor)
                .build();
    }
}
