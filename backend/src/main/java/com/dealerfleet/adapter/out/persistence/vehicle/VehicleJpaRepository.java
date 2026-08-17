package com.dealerfleet.adapter.out.persistence.vehicle;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

interface VehicleJpaRepository
        extends JpaRepository<VehicleJpaEntity, UUID>, JpaSpecificationExecutor<VehicleJpaEntity> {

    List<VehicleJpaEntity> findByDealerId(UUID dealerId);

    Optional<VehicleJpaEntity> findByChassis(String chassis);

    long countByDealerId(UUID dealerId);

    long countByDealerIdIsNull();

    @Query("""
            select vehicle.dealerId as dealerId, count(vehicle) as total
            from VehicleJpaEntity vehicle
            where vehicle.dealerId in :dealerIds
            group by vehicle.dealerId
            """)
    List<DealerVehicleCount> countGroupedByDealer(Collection<UUID> dealerIds);

    interface DealerVehicleCount {

        UUID getDealerId();

        long getTotal();
    }

    @Query("select coalesce(sum(vehicle.price), 0) from VehicleJpaEntity vehicle")
    BigDecimal sumPrice();
}
