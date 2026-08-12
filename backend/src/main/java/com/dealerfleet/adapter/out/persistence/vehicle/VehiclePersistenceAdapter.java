package com.dealerfleet.adapter.out.persistence.vehicle;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Component;

import com.dealerfleet.application.port.out.VehicleRepositoryPort;
import com.dealerfleet.domain.vehicle.Vehicle;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
class VehiclePersistenceAdapter implements VehicleRepositoryPort {

    private final VehicleJpaRepository vehicles;
    private final VehicleMapper mapper;

    @Override
    public Vehicle save(Vehicle vehicle) {
        VehicleJpaEntity entity = vehicles.findById(vehicle.getId())
                .map(managed -> mapper.merge(managed, vehicle))
                .orElseGet(() -> vehicles.save(mapper.toEntity(vehicle)));

        return mapper.toDomain(entity);
    }

    @Override
    public Optional<Vehicle> findById(UUID id) {
        return vehicles.findById(id).map(mapper::toDomain);
    }

    @Override
    public List<Vehicle> findAll() {
        return vehicles.findAll().stream().map(mapper::toDomain).toList();
    }

    @Override
    public List<Vehicle> findByDealerId(UUID dealerId) {
        return vehicles.findByDealerId(dealerId).stream().map(mapper::toDomain).toList();
    }

    @Override
    public Optional<Vehicle> findByChassis(String chassis) {
        return vehicles.findByChassis(chassis).map(mapper::toDomain);
    }

    @Override
    public long countByDealerId(UUID dealerId) {
        return vehicles.countByDealerId(dealerId);
    }

    @Override
    public void deleteById(UUID id) {
        vehicles.deleteById(id);
    }
}
