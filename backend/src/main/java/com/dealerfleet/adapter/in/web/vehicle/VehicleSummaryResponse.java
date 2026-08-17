package com.dealerfleet.adapter.in.web.vehicle;

import java.math.BigDecimal;

import com.dealerfleet.application.port.VehicleSummary;

public record VehicleSummaryResponse(long total, BigDecimal fleetValue, long unassigned) {

    public static VehicleSummaryResponse from(VehicleSummary summary) {
        return new VehicleSummaryResponse(summary.total(), summary.fleetValue(), summary.unassigned());
    }
}
