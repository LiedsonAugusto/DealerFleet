package com.dealerfleet.adapter.out.persistence.vehicle;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;

import com.dealerfleet.application.port.PageQuery;
import com.dealerfleet.application.port.PageResult;
import com.dealerfleet.application.port.SortDirection;
import com.dealerfleet.application.port.VehicleQuery;
import com.dealerfleet.application.port.VehicleSummary;
import com.dealerfleet.application.port.out.VehicleRepositoryPort;
import com.dealerfleet.domain.vehicle.Vehicle;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
class VehiclePersistenceAdapter implements VehicleRepositoryPort {

    private static final Set<String> TEXT_SORTS = Set.of("brand", "model", "fuelType", "color");
    private static final Set<String> NUMERIC_SORTS = Set.of("year", "price");
    private static final Sort TIEBREAKER = Sort.by("id");

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
    public PageResult<Vehicle> search(VehicleQuery query, PageQuery page) {
        Page<VehicleJpaEntity> found = vehicles.findAll(VehicleSpecifications.from(query), pageable(page));

        return PageResult.of(
                found.getContent().stream().map(mapper::toDomain).toList(),
                page,
                found.getTotalElements());
    }

    @Override
    public VehicleSummary summary() {
        return new VehicleSummary(vehicles.count(), vehicles.sumPrice(), vehicles.countByDealerIdIsNull());
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
    public Map<UUID, Long> countByDealerIds(Collection<UUID> dealerIds) {
        return vehicles.countGroupedByDealer(dealerIds).stream()
                .collect(Collectors.toMap(
                        VehicleJpaRepository.DealerVehicleCount::getDealerId,
                        VehicleJpaRepository.DealerVehicleCount::getTotal));
    }

    @Override
    public void deleteById(UUID id) {
        vehicles.deleteById(id);
    }

    private static Pageable pageable(PageQuery page) {
        return PageRequest.of(page.page() - 1, page.size(), sort(page));
    }

    private static Sort sort(PageQuery page) {
        String field = page.sort();

        if (field == null || !(TEXT_SORTS.contains(field) || NUMERIC_SORTS.contains(field))) {
            return TIEBREAKER;
        }

        Sort.Order order = page.direction() == SortDirection.DESC
                ? Sort.Order.desc(field)
                : Sort.Order.asc(field);

        return Sort.by(TEXT_SORTS.contains(field) ? order.nullsLast().ignoreCase() : order.nullsLast())
                .and(TIEBREAKER);
    }
}
