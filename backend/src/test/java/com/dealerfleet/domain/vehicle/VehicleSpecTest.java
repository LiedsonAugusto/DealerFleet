package com.dealerfleet.domain.vehicle;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.math.BigDecimal;
import java.time.Year;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import com.dealerfleet.domain.exception.InvalidValueException;

class VehicleSpecTest {

    private static VehicleSpec.VehicleSpecBuilder validSpec() {
        return VehicleSpec.builder()
                .brand("Fiat")
                .model("Argo")
                .fuelType(FuelType.FLEX)
                .color("Prata");
    }

    @Test
    @DisplayName("campos opcionais ausentes ficam nulos")
    void optionalFieldsStayNull() {
        VehicleSpec spec = validSpec().build();

        assertThat(spec.year()).isNull();
        assertThat(spec.chassis()).isNull();
        assertThat(spec.price()).isNull();
        assertThat(spec.externalColor()).isNull();
    }

    @Test
    @DisplayName("remove espacos das bordas dos obrigatorios")
    void trimsRequiredFields() {
        assertThat(validSpec().brand("  Fiat  ").build().brand()).isEqualTo("Fiat");
    }

    @Test
    @DisplayName("normaliza o chassi para maiusculas")
    void normalizesChassis() {
        assertThat(validSpec().chassis("9bwzzz377vt004251").build().chassis())
                .isEqualTo("9BWZZZ377VT004251");
    }

    @Test
    @DisplayName("aceita ano do modelo seguinte")
    void acceptsNextYear() {
        int next = Year.now().getValue() + 1;

        assertThat(validSpec().year(next).build().year()).isEqualTo(next);
    }

    @Test
    @DisplayName("rejeita ano anterior a 1900")
    void rejectsYearBefore1900() {
        assertThatThrownBy(() -> validSpec().year(1899).build())
                .isInstanceOf(InvalidValueException.class);
    }

    @Test
    @DisplayName("rejeita ano alem do modelo seguinte")
    void rejectsYearTooFarAhead() {
        assertThatThrownBy(() -> validSpec().year(Year.now().getValue() + 2).build())
                .isInstanceOf(InvalidValueException.class);
    }

    @ParameterizedTest
    @ValueSource(strings = {"9BWZZZ377VT00425", "9BWZZZ377VT0042511", "9BWZZZ377VT00425!"})
    @DisplayName("rejeita chassi fora do formato de 17 alfanumericos")
    void rejectsInvalidChassis(String chassis) {
        assertThatThrownBy(() -> validSpec().chassis(chassis).build())
                .isInstanceOf(InvalidValueException.class)
                .hasMessage("Chassi deve conter 17 caracteres alfanumericos");
    }

    @Test
    @DisplayName("aceita valor positivo")
    void acceptsPositivePrice() {
        BigDecimal price = new BigDecimal("89900.00");

        assertThat(validSpec().price(price).build().price()).isEqualByComparingTo(price);
    }

    @ParameterizedTest
    @ValueSource(strings = {"0", "0.00", "-1"})
    @DisplayName("rejeita valor menor ou igual a zero")
    void rejectsNonPositivePrice(String price) {
        assertThatThrownBy(() -> validSpec().price(new BigDecimal(price)).build())
                .isInstanceOf(InvalidValueException.class)
                .hasMessage("Valor deve ser maior que zero");
    }

    @Test
    @DisplayName("rejeita marca em branco")
    void rejectsBlankBrand() {
        assertThatThrownBy(() -> validSpec().brand("  ").build())
                .isInstanceOf(InvalidValueException.class)
                .hasMessage("Marca e obrigatorio");
    }

    @Test
    @DisplayName("rejeita modelo nulo")
    void rejectsNullModel() {
        assertThatThrownBy(() -> validSpec().model(null).build())
                .isInstanceOf(InvalidValueException.class)
                .hasMessage("Modelo e obrigatorio");
    }

    @Test
    @DisplayName("rejeita combustivel nulo")
    void rejectsNullFuelType() {
        assertThatThrownBy(() -> validSpec().fuelType(null).build())
                .isInstanceOf(InvalidValueException.class)
                .hasMessage("Tipo de combustivel e obrigatorio");
    }

    @Test
    @DisplayName("rejeita cor nula")
    void rejectsNullColor() {
        assertThatThrownBy(() -> validSpec().color(null).build())
                .isInstanceOf(InvalidValueException.class)
                .hasMessage("Cor e obrigatorio");
    }
}
