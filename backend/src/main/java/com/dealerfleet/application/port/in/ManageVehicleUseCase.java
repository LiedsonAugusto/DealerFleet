package com.dealerfleet.application.port.in;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import com.dealerfleet.application.port.PageQuery;
import com.dealerfleet.application.port.PageResult;
import com.dealerfleet.application.port.VehicleQuery;
import com.dealerfleet.application.port.VehicleSummary;
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

    PageResult<Vehicle> search(VehicleQuery query, PageQuery page);

    VehicleSummary summary();

    List<Vehicle> findByDealer(UUID dealerId);

    long countByDealer(UUID dealerId);

    Map<UUID, Long> countByDealers(Collection<UUID> dealerIds);
}
