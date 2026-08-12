package com.dealerfleet.application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.dealerfleet.application.port.out.DealerRepositoryPort;
import com.dealerfleet.application.port.out.VehicleRepositoryPort;
import com.dealerfleet.domain.exception.BusinessRuleException;
import com.dealerfleet.domain.exception.NotFoundException;
import com.dealerfleet.domain.vehicle.FuelType;
import com.dealerfleet.domain.vehicle.Vehicle;
import com.dealerfleet.domain.vehicle.VehicleSpec;

@ExtendWith(MockitoExtension.class)
class VehicleServiceTest {

    private static final String CHASSIS = "9BWZZZ377VT004251";

    @Mock
    private VehicleRepositoryPort vehicles;

    @Mock
    private DealerRepositoryPort dealers;

    @InjectMocks
    private VehicleService service;

    private static VehicleSpec spec() {
        return specBuilder().build();
    }

    private static VehicleSpec specWithChassis() {
        return specBuilder().chassis(CHASSIS).build();
    }

    private static VehicleSpec.VehicleSpecBuilder specBuilder() {
        return VehicleSpec.builder()
                .brand("Fiat")
                .model("Argo")
                .fuelType(FuelType.FLEX)
                .color("Prata");
    }

    private void echoSave() {
        when(vehicles.save(any(Vehicle.class))).thenAnswer(call -> call.getArgument(0));
    }

    @Test
    @DisplayName("cadastra veiculo sem concessionaria e nao consulta o repositorio de lojas")
    void createWithoutDealer() {
        echoSave();

        Vehicle created = service.create(spec(), null);

        assertThat(created.isAssigned()).isFalse();
        verify(dealers, never()).existsById(any());
    }

    @Test
    @DisplayName("cadastra veiculo ja vinculado quando a concessionaria existe")
    void createWithExistingDealer() {
        UUID dealerId = UUID.randomUUID();
        when(dealers.existsById(dealerId)).thenReturn(true);
        echoSave();

        assertThat(service.create(spec(), dealerId).getDealerId()).isEqualTo(dealerId);
    }

    @Test
    @DisplayName("recusa cadastro quando a concessionaria informada nao existe")
    void createRejectsUnknownDealer() {
        UUID dealerId = UUID.randomUUID();
        when(dealers.existsById(dealerId)).thenReturn(false);

        assertThatThrownBy(() -> service.create(spec(), dealerId))
                .isInstanceOf(NotFoundException.class);

        verify(vehicles, never()).save(any());
    }

    @Test
    @DisplayName("recusa cadastro com chassi ja utilizado")
    void createRejectsDuplicatedChassis() {
        when(vehicles.findByChassis(CHASSIS))
                .thenReturn(Optional.of(Vehicle.create(specWithChassis(), null)));

        assertThatThrownBy(() -> service.create(specWithChassis(), null))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining(CHASSIS);

        verify(vehicles, never()).save(any());
    }

    @Test
    @DisplayName("nao consulta chassi quando o campo nao foi informado")
    void createSkipsChassisCheckWhenAbsent() {
        echoSave();

        service.create(spec(), null);

        verify(vehicles, never()).findByChassis(any());
    }

    @Test
    @DisplayName("atualiza veiculo existente")
    void updateExistingVehicle() {
        UUID id = UUID.randomUUID();
        when(vehicles.findById(id)).thenReturn(Optional.of(Vehicle.restore(id, spec(), null)));
        echoSave();

        Vehicle updated = service.update(id, specBuilder().brand("Jeep").model("Renegade").build(), null);

        assertThat(updated.getBrand()).isEqualTo("Jeep");
        assertThat(updated.getId()).isEqualTo(id);
    }

    @Test
    @DisplayName("atualizacao troca a concessionaria quando um novo vinculo e informado")
    void updateChangesDealer() {
        UUID id = UUID.randomUUID();
        UUID newDealerId = UUID.randomUUID();
        when(vehicles.findById(id))
                .thenReturn(Optional.of(Vehicle.restore(id, spec(), UUID.randomUUID())));
        when(dealers.existsById(newDealerId)).thenReturn(true);
        echoSave();

        assertThat(service.update(id, spec(), newDealerId).getDealerId()).isEqualTo(newDealerId);
    }

    @Test
    @DisplayName("atualizacao sem concessionaria desvincula o veiculo")
    void updateWithoutDealerUnassigns() {
        UUID id = UUID.randomUUID();
        when(vehicles.findById(id))
                .thenReturn(Optional.of(Vehicle.restore(id, spec(), UUID.randomUUID())));
        echoSave();

        assertThat(service.update(id, spec(), null).isAssigned()).isFalse();
    }

    @Test
    @DisplayName("recusa atualizacao com concessionaria inexistente")
    void updateRejectsUnknownDealer() {
        UUID id = UUID.randomUUID();
        UUID dealerId = UUID.randomUUID();
        when(vehicles.findById(id)).thenReturn(Optional.of(Vehicle.restore(id, spec(), null)));
        when(dealers.existsById(dealerId)).thenReturn(false);

        assertThatThrownBy(() -> service.update(id, spec(), dealerId))
                .isInstanceOf(NotFoundException.class);

        verify(vehicles, never()).save(any());
    }

    @Test
    @DisplayName("mantem o proprio chassi na atualizacao sem acusar duplicidade")
    void updateKeepsOwnChassis() {
        UUID id = UUID.randomUUID();
        Vehicle existing = Vehicle.restore(id, specWithChassis(), null);
        when(vehicles.findById(id)).thenReturn(Optional.of(existing));
        when(vehicles.findByChassis(CHASSIS)).thenReturn(Optional.of(existing));
        echoSave();

        assertThat(service.update(id, specWithChassis(), null).getChassis()).isEqualTo(CHASSIS);
    }

    @Test
    @DisplayName("recusa atualizacao com chassi pertencente a outro veiculo")
    void updateRejectsChassisFromAnotherVehicle() {
        UUID id = UUID.randomUUID();
        when(vehicles.findById(id)).thenReturn(Optional.of(Vehicle.restore(id, spec(), null)));
        when(vehicles.findByChassis(CHASSIS))
                .thenReturn(Optional.of(Vehicle.create(specWithChassis(), null)));

        assertThatThrownBy(() -> service.update(id, specWithChassis(), null))
                .isInstanceOf(BusinessRuleException.class);

        verify(vehicles, never()).save(any());
    }

    @Test
    @DisplayName("recusa atualizacao de veiculo inexistente")
    void updateRejectsUnknownVehicle() {
        UUID id = UUID.randomUUID();
        when(vehicles.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.update(id, spec(), null))
                .isInstanceOf(NotFoundException.class);
    }

    @Test
    @DisplayName("vincula veiculo a concessionaria existente")
    void assignToDealer() {
        UUID id = UUID.randomUUID();
        UUID dealerId = UUID.randomUUID();
        when(vehicles.findById(id)).thenReturn(Optional.of(Vehicle.restore(id, spec(), null)));
        when(dealers.existsById(dealerId)).thenReturn(true);
        echoSave();

        assertThat(service.assignToDealer(id, dealerId).getDealerId()).isEqualTo(dealerId);
    }

    @Test
    @DisplayName("recusa vinculo com concessionaria inexistente")
    void assignRejectsUnknownDealer() {
        UUID id = UUID.randomUUID();
        UUID dealerId = UUID.randomUUID();
        when(vehicles.findById(id)).thenReturn(Optional.of(Vehicle.restore(id, spec(), null)));
        when(dealers.existsById(dealerId)).thenReturn(false);

        assertThatThrownBy(() -> service.assignToDealer(id, dealerId))
                .isInstanceOf(NotFoundException.class);

        verify(vehicles, never()).save(any());
    }

    @Test
    @DisplayName("desvincula veiculo da concessionaria")
    void unassignFromDealer() {
        UUID id = UUID.randomUUID();
        when(vehicles.findById(id))
                .thenReturn(Optional.of(Vehicle.restore(id, spec(), UUID.randomUUID())));
        echoSave();

        assertThat(service.unassignFromDealer(id).isAssigned()).isFalse();
    }

    @Test
    @DisplayName("exclui veiculo existente")
    void deleteExistingVehicle() {
        UUID id = UUID.randomUUID();
        when(vehicles.findById(id)).thenReturn(Optional.of(Vehicle.restore(id, spec(), null)));

        service.delete(id);

        verify(vehicles).deleteById(id);
    }

    @Test
    @DisplayName("recusa exclusao de veiculo inexistente")
    void deleteRejectsUnknownVehicle() {
        UUID id = UUID.randomUUID();
        when(vehicles.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.delete(id)).isInstanceOf(NotFoundException.class);

        verify(vehicles, never()).deleteById(any());
    }

    @Test
    @DisplayName("lista veiculos de uma concessionaria existente")
    void findByDealer() {
        UUID dealerId = UUID.randomUUID();
        when(dealers.existsById(dealerId)).thenReturn(true);
        when(vehicles.findByDealerId(dealerId))
                .thenReturn(List.of(Vehicle.create(spec(), dealerId)));

        assertThat(service.findByDealer(dealerId)).hasSize(1);
    }

    @Test
    @DisplayName("listar por concessionaria inexistente e erro, nao lista vazia")
    void findByDealerRejectsUnknownDealer() {
        UUID dealerId = UUID.randomUUID();
        when(dealers.existsById(dealerId)).thenReturn(false);

        assertThatThrownBy(() -> service.findByDealer(dealerId))
                .isInstanceOf(NotFoundException.class);

        verify(vehicles, never()).findByDealerId(any());
    }

    @Test
    @DisplayName("consulta veiculo existente por identificador")
    void findByIdReturnsVehicle() {
        UUID id = UUID.randomUUID();
        when(vehicles.findById(id)).thenReturn(Optional.of(Vehicle.restore(id, spec(), null)));

        assertThat(service.findById(id).getId()).isEqualTo(id);
    }

    @Test
    @DisplayName("lista todos os veiculos")
    void findAllReturnsVehicles() {
        when(vehicles.findAll()).thenReturn(List.of(Vehicle.create(spec(), null)));

        assertThat(service.findAll()).hasSize(1);
    }

    @Test
    @DisplayName("consulta por identificador inexistente resulta em erro")
    void findByIdRejectsUnknownVehicle() {
        UUID id = UUID.randomUUID();
        when(vehicles.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.findById(id)).isInstanceOf(NotFoundException.class);
    }
}
