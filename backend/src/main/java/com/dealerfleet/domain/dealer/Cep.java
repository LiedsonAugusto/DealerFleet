package com.dealerfleet.domain.dealer;

import com.dealerfleet.domain.exception.InvalidValueException;

public record Cep(String value) {

    private static final int LENGTH = 8;

    public Cep {
        if (value == null || value.isBlank()) {
            throw new InvalidValueException("CEP e obrigatorio");
        }
        value = value.replaceAll("\\D", "");
        if (value.length() != LENGTH) {
            throw new InvalidValueException("CEP deve conter 8 digitos");
        }
    }

    public String formatted() {
        return "%s-%s".formatted(value.substring(0, 5), value.substring(5));
    }
}
