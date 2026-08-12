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
import com.dealerfleet.domain.dealer.Address;
import com.dealerfleet.domain.dealer.Cep;
import com.dealerfleet.domain.dealer.Cnpj;
import com.dealerfleet.domain.dealer.Dealer;
import com.dealerfleet.domain.exception.BusinessRuleException;
import com.dealerfleet.domain.exception.InvalidValueException;
import com.dealerfleet.domain.exception.NotFoundException;

@ExtendWith(MockitoExtension.class)
class DealerServiceTest {

    private static final String NAME = "Concessionaria Centro LTDA";
    private static final Cnpj CNPJ = new Cnpj("11222333000181");
    private static final Cnpj OTHER_CNPJ = new Cnpj("12345678000195");

    @Mock
    private DealerRepositoryPort dealers;

    @Mock
    private VehicleRepositoryPort vehicles;

    @InjectMocks
    private DealerService service;

    private static Address address() {
        return Address.builder()
                .cep(new Cep("58400-500"))
                .street("Rua Jose de Alencar")
                .neighborhood("Prata")
                .city("Campina Grande")
                .state("PB")
                .build();
    }

    private void echoSave() {
        when(dealers.save(any(Dealer.class))).thenAnswer(call -> call.getArgument(0));
    }

    @Test
    @DisplayName("cadastra concessionaria com CNPJ livre")
    void createWithAvailableCnpj() {
        when(dealers.findByCnpj(CNPJ)).thenReturn(Optional.empty());
        echoSave();

        Dealer created = service.create(NAME, CNPJ, address());

        assertThat(created.getId()).isNotNull();
        assertThat(created.getCnpj()).isEqualTo(CNPJ);
    }

    @Test
    @DisplayName("recusa cadastro com CNPJ ja utilizado")
    void createRejectsDuplicatedCnpj() {
        when(dealers.findByCnpj(CNPJ)).thenReturn(Optional.of(Dealer.create(NAME, CNPJ, address())));

        assertThatThrownBy(() -> service.create(NAME, CNPJ, address()))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining(CNPJ.formatted());

        verify(dealers, never()).save(any());
    }

    @Test
    @DisplayName("mantem o proprio CNPJ na atualizacao sem acusar duplicidade")
    void updateKeepsOwnCnpj() {
        UUID id = UUID.randomUUID();
        Dealer existing = Dealer.restore(id, NAME, CNPJ, address());
        when(dealers.findById(id)).thenReturn(Optional.of(existing));
        when(dealers.findByCnpj(CNPJ)).thenReturn(Optional.of(existing));
        echoSave();

        Dealer updated = service.update(id, "Concessionaria Norte LTDA", CNPJ, address());

        assertThat(updated.getCorporateName()).isEqualTo("Concessionaria Norte LTDA");
    }

    @Test
    @DisplayName("recusa atualizacao com CNPJ pertencente a outra concessionaria")
    void updateRejectsCnpjFromAnotherDealer() {
        UUID id = UUID.randomUUID();
        when(dealers.findById(id)).thenReturn(Optional.of(Dealer.restore(id, NAME, CNPJ, address())));
        when(dealers.findByCnpj(OTHER_CNPJ))
                .thenReturn(Optional.of(Dealer.create("Outra LTDA", OTHER_CNPJ, address())));

        assertThatThrownBy(() -> service.update(id, NAME, OTHER_CNPJ, address()))
                .isInstanceOf(BusinessRuleException.class);

        verify(dealers, never()).save(any());
    }

    @Test
    @DisplayName("recusa atualizacao de concessionaria inexistente")
    void updateRejectsUnknownDealer() {
        UUID id = UUID.randomUUID();
        when(dealers.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.update(id, NAME, CNPJ, address()))
                .isInstanceOf(NotFoundException.class);
    }

    @Test
    @DisplayName("exclui concessionaria sem veiculos vinculados")
    void deleteWithoutLinkedVehicles() {
        UUID id = UUID.randomUUID();
        when(dealers.findById(id)).thenReturn(Optional.of(Dealer.restore(id, NAME, CNPJ, address())));
        when(vehicles.countByDealerId(id)).thenReturn(0L);

        service.delete(id);

        verify(dealers).deleteById(id);
    }

    @Test
    @DisplayName("bloqueia exclusao de concessionaria com veiculos vinculados e informa a quantidade")
    void deleteBlockedByLinkedVehicles() {
        UUID id = UUID.randomUUID();
        when(dealers.findById(id)).thenReturn(Optional.of(Dealer.restore(id, NAME, CNPJ, address())));
        when(vehicles.countByDealerId(id)).thenReturn(3L);

        assertThatThrownBy(() -> service.delete(id))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("3 veiculo(s)");

        verify(dealers, never()).deleteById(any());
    }

    @Test
    @DisplayName("recusa exclusao de concessionaria inexistente")
    void deleteRejectsUnknownDealer() {
        UUID id = UUID.randomUUID();
        when(dealers.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.delete(id)).isInstanceOf(NotFoundException.class);

        verify(vehicles, never()).countByDealerId(any());
    }

    @Test
    @DisplayName("consulta por identificador inexistente resulta em erro")
    void findByIdRejectsUnknownDealer() {
        UUID id = UUID.randomUUID();
        when(dealers.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.findById(id)).isInstanceOf(NotFoundException.class);
    }

    @Test
    @DisplayName("consulta concessionaria existente por identificador")
    void findByIdReturnsDealer() {
        UUID id = UUID.randomUUID();
        when(dealers.findById(id)).thenReturn(Optional.of(Dealer.restore(id, NAME, CNPJ, address())));

        assertThat(service.findById(id).getId()).isEqualTo(id);
    }

    @Test
    @DisplayName("lista todas as concessionarias")
    void findAllReturnsDealers() {
        when(dealers.findAll()).thenReturn(List.of(Dealer.create(NAME, CNPJ, address())));

        assertThat(service.findAll()).hasSize(1);
    }

    @Test
    @DisplayName("CNPJ nulo vira erro de dominio, nao NullPointerException")
    void createWithNullCnpjFailsAsDomainError() {
        assertThatThrownBy(() -> service.create(NAME, null, address()))
                .isInstanceOf(InvalidValueException.class)
                .hasMessage("CNPJ e obrigatorio");

        verify(dealers, never()).findByCnpj(any());
    }
}
