package com.dealerfleet.domain.dealer;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.dealerfleet.domain.exception.InvalidValueException;

class AddressTest {

    private static Address.AddressBuilder validAddress() {
        return Address.builder()
                .cep(new Cep("58400-000"))
                .street("Rua Sao Vicente")
                .number("120")
                .neighborhood("Centro")
                .city("Campina Grande")
                .state("PB");
    }

    @Test
    @DisplayName("constroi endereco completo")
    void buildsCompleteAddress() {
        Address address = validAddress().complement("Sala 3").build();

        assertThat(address.cep().value()).isEqualTo("58400000");
        assertThat(address.street()).isEqualTo("Rua Sao Vicente");
        assertThat(address.number()).isEqualTo("120");
        assertThat(address.complement()).isEqualTo("Sala 3");
        assertThat(address.neighborhood()).isEqualTo("Centro");
        assertThat(address.city()).isEqualTo("Campina Grande");
        assertThat(address.state()).isEqualTo("PB");
    }

    @Test
    @DisplayName("normaliza a UF para maiuscula")
    void normalizesState() {
        assertThat(validAddress().state("pb").build().state()).isEqualTo("PB");
    }

    @Test
    @DisplayName("remove espacos das bordas dos campos de texto")
    void trimsTextFields() {
        assertThat(validAddress().street("  Rua Sao Vicente  ").build().street())
                .isEqualTo("Rua Sao Vicente");
    }

    @Test
    @DisplayName("campos opcionais em branco viram nulo")
    void blankOptionalsBecomeNull() {
        Address address = validAddress().number("   ").complement("").build();

        assertThat(address.number()).isNull();
        assertThat(address.complement()).isNull();
    }

    @Test
    @DisplayName("rejeita UF fora das 27 unidades federativas")
    void rejectsUnknownState() {
        assertThatThrownBy(() -> validAddress().state("XX").build())
                .isInstanceOf(InvalidValueException.class)
                .hasMessage("Estado invalido: XX");
    }

    @Test
    @DisplayName("rejeita CEP nulo")
    void rejectsNullCep() {
        assertThatThrownBy(() -> validAddress().cep(null).build())
                .isInstanceOf(InvalidValueException.class)
                .hasMessage("CEP e obrigatorio");
    }

    @Test
    @DisplayName("rejeita logradouro em branco")
    void rejectsBlankStreet() {
        assertThatThrownBy(() -> validAddress().street("  ").build())
                .isInstanceOf(InvalidValueException.class)
                .hasMessage("Logradouro e obrigatorio");
    }

    @Test
    @DisplayName("rejeita bairro nulo")
    void rejectsNullNeighborhood() {
        assertThatThrownBy(() -> validAddress().neighborhood(null).build())
                .isInstanceOf(InvalidValueException.class)
                .hasMessage("Bairro e obrigatorio");
    }

    @Test
    @DisplayName("rejeita cidade nula")
    void rejectsNullCity() {
        assertThatThrownBy(() -> validAddress().city(null).build())
                .isInstanceOf(InvalidValueException.class)
                .hasMessage("Cidade e obrigatorio");
    }
}
