package com.dealerfleet.domain.dealer;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

import com.dealerfleet.domain.exception.InvalidValueException;

class CnpjTest {

    @Test
    @DisplayName("remove a mascara e guarda somente digitos")
    void removesMask() {
        assertThat(new Cnpj("11.222.333/0001-81").value()).isEqualTo("11222333000181");
    }

    @Test
    @DisplayName("mascarado e limpo sao o mesmo CNPJ")
    void maskedEqualsUnmasked() {
        assertThat(new Cnpj("11.222.333/0001-81")).isEqualTo(new Cnpj("11222333000181"));
    }

    @Test
    @DisplayName("formatted aplica a mascara para exibicao")
    void formattedAppliesMask() {
        assertThat(new Cnpj("11222333000181").formatted()).isEqualTo("11.222.333/0001-81");
    }

    @ParameterizedTest
    @ValueSource(strings = {"11222333000181", "12345678000195"})
    @DisplayName("aceita CNPJ com digitos verificadores corretos")
    void acceptsValidCnpj(String value) {
        assertThat(new Cnpj(value).value()).isEqualTo(value);
    }

    @Test
    @DisplayName("aceita CNPJ cujo digito verificador calculado e zero")
    void acceptsZeroCheckDigit() {
        assertThat(new Cnpj("11222333000505").value()).isEqualTo("11222333000505");
    }

    @ParameterizedTest
    @ValueSource(strings = {"11222333000191", "11222333000182", "12345678000196"})
    @DisplayName("rejeita primeiro ou segundo digito verificador errado")
    void rejectsWrongCheckDigit(String value) {
        assertThatThrownBy(() -> new Cnpj(value))
                .isInstanceOf(InvalidValueException.class)
                .hasMessage("CNPJ invalido");
    }

    @ParameterizedTest
    @ValueSource(strings = {"00000000000000", "11111111111111", "99999999999999"})
    @DisplayName("rejeita sequencia de digitos repetidos")
    void rejectsRepeatedDigits(String value) {
        assertThatThrownBy(() -> new Cnpj(value))
                .isInstanceOf(InvalidValueException.class)
                .hasMessage("CNPJ invalido");
    }

    @ParameterizedTest
    @ValueSource(strings = {"123", "112223330001812"})
    @DisplayName("rejeita quantidade de digitos diferente de 14")
    void rejectsWrongLength(String value) {
        assertThatThrownBy(() -> new Cnpj(value))
                .isInstanceOf(InvalidValueException.class)
                .hasMessage("CNPJ deve conter 14 digitos");
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {"   "})
    @DisplayName("rejeita nulo, vazio e em branco")
    void rejectsNullOrBlank(String value) {
        assertThatThrownBy(() -> new Cnpj(value))
                .isInstanceOf(InvalidValueException.class)
                .hasMessage("CNPJ e obrigatorio");
    }
}
