package com.dealerfleet.domain.vehicle;

import java.math.BigDecimal;
import java.util.UUID;

import com.dealerfleet.domain.shared.Fields;

import lombok.Getter;

@Getter
public class Vehicle {

    private final UUID id;
    private String brand;
    private String model;
    private FuelType fuelType;
    private String color;
    private Integer year;
    private String chassis;
    private BigDecimal price;
    private String externalColor;
    private UUID dealerId;

    private Vehicle(UUID id, VehicleSpec spec, UUID dealerId) {
        this.id = id;
        this.dealerId = dealerId;
        applySpec(spec);
    }

    public static Vehicle create(VehicleSpec spec, UUID dealerId) {
        return new Vehicle(UUID.randomUUID(), spec, dealerId);
    }

    public static Vehicle restore(UUID id, VehicleSpec spec, UUID dealerId) {
        return new Vehicle(Fields.requiredValue(id, "Id"), spec, dealerId);
    }

    public void update(VehicleSpec spec) {
        applySpec(spec);
    }

    public void assignTo(UUID dealerId) {
        this.dealerId = Fields.requiredValue(dealerId, "Concessionaria");
    }

    public void unassign() {
        this.dealerId = null;
    }

    public boolean isAssigned() {
        return dealerId != null;
    }

    private void applySpec(VehicleSpec spec) {
        Fields.requiredValue(spec, "Dados do veiculo");
        this.brand = spec.brand();
        this.model = spec.model();
        this.fuelType = spec.fuelType();
        this.color = spec.color();
        this.year = spec.year();
        this.chassis = spec.chassis();
        this.price = spec.price();
        this.externalColor = spec.externalColor();
    }

    @Override
    public boolean equals(Object other) {
        if (this == other) {
            return true;
        }
        return other instanceof Vehicle vehicle && id.equals(vehicle.id);
    }

    @Override
    public int hashCode() {
        return id.hashCode();
    }
}
