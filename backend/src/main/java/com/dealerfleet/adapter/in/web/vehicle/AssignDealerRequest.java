package com.dealerfleet.adapter.in.web.vehicle;

import java.util.UUID;

import jakarta.validation.constraints.NotNull;

public record AssignDealerRequest(@NotNull UUID dealerId) {
}
