package com.dealerfleet.adapter.out.persistence.vehicle;

import org.springframework.stereotype.Component;

import com.dealerfleet.domain.vehicle.Vehicle;
import com.dealerfleet.domain.vehicle.VehicleSpec;

@Component
class VehicleMapper {

    Vehicle toDomain(VehicleJpaEntity entity) {
        return Vehicle.restore(
                entity.getId(),
                VehicleSpec.builder()
                        .brand(entity.getBrand())
                        .model(entity.getModel())
                        .fuelType(entity.getFuelType())
                        .color(entity.getColor())
                        .year(entity.getYear())
                        .chassis(entity.getChassis())
                        .price(entity.getPrice())
                        .externalColor(entity.getExternalColor())
                        .build(),
                entity.getDealerId());
    }

    VehicleJpaEntity toEntity(Vehicle vehicle) {
        VehicleJpaEntity entity = new VehicleJpaEntity();
        entity.setId(vehicle.getId());
        copy(entity, vehicle);
        return entity;
    }

    VehicleJpaEntity merge(VehicleJpaEntity entity, Vehicle vehicle) {
        copy(entity, vehicle);
        return entity;
    }

    private void copy(VehicleJpaEntity entity, Vehicle vehicle) {
        entity.setBrand(vehicle.getBrand());
        entity.setModel(vehicle.getModel());
        entity.setFuelType(vehicle.getFuelType());
        entity.setColor(vehicle.getColor());
        entity.setYear(vehicle.getYear());
        entity.setChassis(vehicle.getChassis());
        entity.setPrice(vehicle.getPrice());
        entity.setExternalColor(vehicle.getExternalColor());
        entity.setDealerId(vehicle.getDealerId());
    }
}
