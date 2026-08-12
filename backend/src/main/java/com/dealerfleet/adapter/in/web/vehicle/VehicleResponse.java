package com.dealerfleet.adapter.in.web.vehicle;

import java.math.BigDecimal;
import java.util.UUID;

import com.dealerfleet.domain.vehicle.FuelType;
import com.dealerfleet.domain.vehicle.Vehicle;

public record VehicleResponse(
        UUID id,
        String brand,
        String model,
        FuelType fuelType,
        String color,
        Integer year,
        String chassis,
        BigDecimal price,
        String externalColor,
        UUID dealerId) {

    public static VehicleResponse from(Vehicle vehicle) {
        return new VehicleResponse(
                vehicle.getId(),
                vehicle.getBrand(),
                vehicle.getModel(),
                vehicle.getFuelType(),
                vehicle.getColor(),
                vehicle.getYear(),
                vehicle.getChassis(),
                vehicle.getPrice(),
                vehicle.getExternalColor(),
                vehicle.getDealerId());
    }
}
