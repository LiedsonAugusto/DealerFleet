package com.dealerfleet.application.port.in;

import java.util.List;
import java.util.UUID;

import com.dealerfleet.domain.vehicle.Vehicle;
import com.dealerfleet.domain.vehicle.VehicleSpec;

public interface ManageVehicleUseCase {

    Vehicle create(VehicleSpec spec, UUID dealerId);

    Vehicle update(UUID id, VehicleSpec spec, UUID dealerId);

    Vehicle assignToDealer(UUID id, UUID dealerId);

    Vehicle unassignFromDealer(UUID id);

    void delete(UUID id);

    Vehicle findById(UUID id);

    List<Vehicle> findAll();

    List<Vehicle> findByDealer(UUID dealerId);
}
