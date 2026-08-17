package com.dealerfleet.application.service;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.dealerfleet.application.port.PageQuery;
import com.dealerfleet.application.port.PageResult;
import com.dealerfleet.application.port.VehicleQuery;
import com.dealerfleet.application.port.VehicleSummary;
import com.dealerfleet.application.port.in.ManageVehicleUseCase;
import com.dealerfleet.application.port.out.DealerRepositoryPort;
import com.dealerfleet.application.port.out.VehicleRepositoryPort;
import com.dealerfleet.domain.exception.BusinessRuleException;
import com.dealerfleet.domain.exception.NotFoundException;
import com.dealerfleet.domain.vehicle.Vehicle;
import com.dealerfleet.domain.vehicle.VehicleSpec;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class VehicleService implements ManageVehicleUseCase {

    private final VehicleRepositoryPort vehicles;
    private final DealerRepositoryPort dealers;

    @Override
    public Vehicle create(VehicleSpec spec, UUID dealerId) {
        if (dealerId != null) {
            requireDealerExists(dealerId);
        }
        requireAvailableChassis(spec.chassis(), null);

        Vehicle vehicle = Vehicle.create(spec, dealerId);
        log.info("Cadastrando veiculo {} {} id={}", vehicle.getBrand(), vehicle.getModel(), vehicle.getId());
        return vehicles.save(vehicle);
    }

    @Override
    public Vehicle update(UUID id, VehicleSpec spec, UUID dealerId) {
        Vehicle vehicle = requireVehicle(id);
        requireAvailableChassis(spec.chassis(), id);

        if (dealerId == null) {
            vehicle.unassign();
        } else {
            requireDealerExists(dealerId);
            vehicle.assignTo(dealerId);
        }

        vehicle.update(spec);
        log.info("Atualizando veiculo id={}", id);
        return vehicles.save(vehicle);
    }

    @Override
    public Vehicle assignToDealer(UUID id, UUID dealerId) {
        Vehicle vehicle = requireVehicle(id);
        requireDealerExists(dealerId);

        vehicle.assignTo(dealerId);
        log.info("Vinculando veiculo id={} a concessionaria id={}", id, dealerId);
        return vehicles.save(vehicle);
    }

    @Override
    public Vehicle unassignFromDealer(UUID id) {
        Vehicle vehicle = requireVehicle(id);

        vehicle.unassign();
        log.info("Desvinculando veiculo id={}", id);
        return vehicles.save(vehicle);
    }

    @Override
    public void delete(UUID id) {
        requireVehicle(id);

        log.info("Excluindo veiculo id={}", id);
        vehicles.deleteById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public Vehicle findById(UUID id) {
        return requireVehicle(id);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Vehicle> findAll() {
        return vehicles.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public PageResult<Vehicle> search(VehicleQuery query, PageQuery page) {
        return vehicles.search(query == null ? VehicleQuery.none() : query,
                page == null ? PageQuery.first() : page);
    }

    @Override
    @Transactional(readOnly = true)
    public VehicleSummary summary() {
        return vehicles.summary();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Vehicle> findByDealer(UUID dealerId) {
        requireDealerExists(dealerId);
        return vehicles.findByDealerId(dealerId);
    }

    @Override
    @Transactional(readOnly = true)
    public long countByDealer(UUID dealerId) {
        return vehicles.countByDealerId(dealerId);
    }

    @Override
    @Transactional(readOnly = true)
    public Map<UUID, Long> countByDealers(Collection<UUID> dealerIds) {
        return dealerIds.isEmpty() ? Map.of() : vehicles.countByDealerIds(dealerIds);
    }

    private Vehicle requireVehicle(UUID id) {
        return vehicles.findById(id).orElseThrow(() -> NotFoundException.vehicle(id));
    }

    private void requireDealerExists(UUID dealerId) {
        if (!dealers.existsById(dealerId)) {
            throw NotFoundException.dealer(dealerId);
        }
    }

    private void requireAvailableChassis(String chassis, UUID currentId) {
        if (chassis == null) {
            return;
        }
        vehicles.findByChassis(chassis)
                .filter(found -> !found.getId().equals(currentId))
                .ifPresent(found -> {
                    throw new BusinessRuleException("Chassi ja cadastrado: " + chassis);
                });
    }
}
