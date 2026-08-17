package com.dealerfleet.application.port;

import java.util.UUID;

import com.dealerfleet.domain.vehicle.FuelType;

public record VehicleQuery(
        String search,
        String brand,
        String model,
        String color,
        String year,
        FuelType fuelType,
        UUID dealerId,
        boolean unassigned) {

    public VehicleQuery {
        search = blankToNull(search);
        brand = blankToNull(brand);
        model = blankToNull(model);
        color = blankToNull(color);
        year = blankToNull(year);
    }

    public static VehicleQuery none() {
        return new VehicleQuery(null, null, null, null, null, null, null, false);
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
