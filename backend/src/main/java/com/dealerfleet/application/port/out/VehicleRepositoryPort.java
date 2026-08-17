package com.dealerfleet.application.port.out;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import com.dealerfleet.application.port.PageQuery;
import com.dealerfleet.application.port.PageResult;
import com.dealerfleet.application.port.VehicleQuery;
import com.dealerfleet.application.port.VehicleSummary;
import com.dealerfleet.domain.vehicle.Vehicle;

public interface VehicleRepositoryPort {

    Vehicle save(Vehicle vehicle);

    Optional<Vehicle> findById(UUID id);

    List<Vehicle> findAll();

    PageResult<Vehicle> search(VehicleQuery query, PageQuery page);

    VehicleSummary summary();

    List<Vehicle> findByDealerId(UUID dealerId);

    Optional<Vehicle> findByChassis(String chassis);

    long countByDealerId(UUID dealerId);

    Map<UUID, Long> countByDealerIds(Collection<UUID> dealerIds);

    void deleteById(UUID id);
}
