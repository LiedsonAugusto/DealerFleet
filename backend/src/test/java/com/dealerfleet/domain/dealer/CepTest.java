package com.dealerfleet.domain.dealer;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

import com.dealerfleet.domain.exception.InvalidValueException;

class CepTest {

    @Test
    @DisplayName("remove a mascara e guarda somente digitos")
    void removesMask() {
        assertThat(new Cep("58400-000").value()).isEqualTo("58400000");
    }

    @Test
    @DisplayName("mascarado e limpo sao o mesmo CEP")
    void maskedEqualsUnmasked() {
        assertThat(new Cep("58400-000")).isEqualTo(new Cep("58400000"));
    }

    @Test
    @DisplayName("formatted aplica a mascara para exibicao")
    void formattedAppliesMask() {
        assertThat(new Cep("58400000").formatted()).isEqualTo("58400-000");
    }

    @ParameterizedTest
    @ValueSource(strings = {"584000", "584000001"})
    @DisplayName("rejeita quantidade de digitos diferente de 8")
    void rejectsWrongLength(String value) {
        assertThatThrownBy(() -> new Cep(value))
                .isInstanceOf(InvalidValueException.class)
                .hasMessage("CEP deve conter 8 digitos");
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {"   "})
    @DisplayName("rejeita nulo, vazio e em branco")
    void rejectsNullOrBlank(String value) {
        assertThatThrownBy(() -> new Cep(value))
                .isInstanceOf(InvalidValueException.class)
                .hasMessage("CEP e obrigatorio");
    }
}
