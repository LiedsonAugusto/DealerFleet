package com.dealerfleet.domain.vehicle;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.dealerfleet.domain.exception.InvalidValueException;

class VehicleTest {

    private static VehicleSpec spec() {
        return VehicleSpec.builder()
                .brand("Fiat")
                .model("Argo")
                .fuelType(FuelType.FLEX)
                .color("Prata")
                .build();
    }

    @Test
    @DisplayName("create gera identidade propria")
    void createGeneratesId() {
        assertThat(Vehicle.create(spec(), null).getId()).isNotNull();
    }

    @Test
    @DisplayName("create sem concessionaria deixa o veiculo desvinculado")
    void createWithoutDealer() {
        Vehicle vehicle = Vehicle.create(spec(), null);

        assertThat(vehicle.getDealerId()).isNull();
        assertThat(vehicle.isAssigned()).isFalse();
    }

    @Test
    @DisplayName("create com concessionaria ja nasce vinculado")
    void createWithDealer() {
        UUID dealerId = UUID.randomUUID();
        Vehicle vehicle = Vehicle.create(spec(), dealerId);

        assertThat(vehicle.getDealerId()).isEqualTo(dealerId);
        assertThat(vehicle.isAssigned()).isTrue();
    }

    @Test
    @DisplayName("restore preserva a identidade recebida")
    void restoreKeepsId() {
        UUID id = UUID.randomUUID();

        assertThat(Vehicle.restore(id, spec(), null).getId()).isEqualTo(id);
    }

    @Test
    @DisplayName("restore exige identidade")
    void restoreRequiresId() {
        assertThatThrownBy(() -> Vehicle.restore(null, spec(), null))
                .isInstanceOf(InvalidValueException.class)
                .hasMessage("Id e obrigatorio");
    }

    @Test
    @DisplayName("assignTo vincula a concessionaria")
    void assignToLinksDealer() {
        Vehicle vehicle = Vehicle.create(spec(), null);
        UUID dealerId = UUID.randomUUID();

        vehicle.assignTo(dealerId);

        assertThat(vehicle.getDealerId()).isEqualTo(dealerId);
        assertThat(vehicle.isAssigned()).isTrue();
    }

    @Test
    @DisplayName("assignTo rejeita concessionaria nula")
    void assignToRejectsNull() {
        Vehicle vehicle = Vehicle.create(spec(), null);

        assertThatThrownBy(() -> vehicle.assignTo(null))
                .isInstanceOf(InvalidValueException.class)
                .hasMessage("Concessionaria e obrigatorio");
    }

    @Test
    @DisplayName("unassign desvincula sem erro")
    void unassignClearsDealer() {
        Vehicle vehicle = Vehicle.create(spec(), UUID.randomUUID());

        vehicle.unassign();

        assertThat(vehicle.getDealerId()).isNull();
        assertThat(vehicle.isAssigned()).isFalse();
    }

    @Test
    @DisplayName("update troca os atributos e preserva identidade e vinculo")
    void updateReplacesAttributes() {
        UUID dealerId = UUID.randomUUID();
        Vehicle vehicle = Vehicle.create(spec(), dealerId);
        UUID id = vehicle.getId();

        vehicle.update(VehicleSpec.builder()
                .brand("Jeep")
                .model("Renegade")
                .fuelType(FuelType.DIESEL)
                .color("Preto")
                .year(2025)
                .build());

        assertThat(vehicle.getBrand()).isEqualTo("Jeep");
        assertThat(vehicle.getModel()).isEqualTo("Renegade");
        assertThat(vehicle.getFuelType()).isEqualTo(FuelType.DIESEL);
        assertThat(vehicle.getYear()).isEqualTo(2025);
        assertThat(vehicle.getId()).isEqualTo(id);
        assertThat(vehicle.getDealerId()).isEqualTo(dealerId);
    }

    @Test
    @DisplayName("update rejeita dados nulos")
    void updateRejectsNullSpec() {
        Vehicle vehicle = Vehicle.create(spec(), null);

        assertThatThrownBy(() -> vehicle.update(null))
                .isInstanceOf(InvalidValueException.class)
                .hasMessage("Dados do veiculo e obrigatorio");
    }

    @Test
    @DisplayName("igualdade e por identidade, nao por atributos")
    void equalsById() {
        UUID id = UUID.randomUUID();
        Vehicle one = Vehicle.restore(id, spec(), null);
        Vehicle same = Vehicle.restore(id, spec(), UUID.randomUUID());
        Vehicle other = Vehicle.create(spec(), null);

        assertThat(one).isEqualTo(same).isNotEqualTo(other);
    }

    @Test
    @DisplayName("veiculo e igual a si mesmo e compartilha hashCode com a mesma identidade")
    void equalsItselfAndSharesHashCode() {
        UUID id = UUID.randomUUID();
        Vehicle vehicle = Vehicle.restore(id, spec(), null);

        assertThat(vehicle).isEqualTo(vehicle)
                .hasSameHashCodeAs(Vehicle.restore(id, spec(), null));
    }

    @Test
    @DisplayName("nunca e igual a objeto de outro tipo")
    void neverEqualsOtherType() {
        assertThat(Vehicle.create(spec(), null)).isNotEqualTo("Fiat Argo");
    }
}
