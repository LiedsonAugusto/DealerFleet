package com.dealerfleet.adapter.out.persistence.vehicle;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

interface VehicleJpaRepository extends JpaRepository<VehicleJpaEntity, UUID> {

    List<VehicleJpaEntity> findByDealerId(UUID dealerId);

    Optional<VehicleJpaEntity> findByChassis(String chassis);

    long countByDealerId(UUID dealerId);
}
