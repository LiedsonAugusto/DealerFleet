package com.dealerfleet.application.port.out;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.dealerfleet.domain.vehicle.Vehicle;

public interface VehicleRepositoryPort {

    Vehicle save(Vehicle vehicle);

    Optional<Vehicle> findById(UUID id);

    List<Vehicle> findAll();

    List<Vehicle> findByDealerId(UUID dealerId);

    Optional<Vehicle> findByChassis(String chassis);

    long countByDealerId(UUID dealerId);

    void deleteById(UUID id);
}
