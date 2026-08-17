package com.dealerfleet.application.port;

import java.math.BigDecimal;

public record VehicleSummary(long total, BigDecimal fleetValue, long unassigned) {

    public VehicleSummary {
        fleetValue = fleetValue == null ? BigDecimal.ZERO : fleetValue;
    }
}
