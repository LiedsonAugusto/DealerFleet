package com.dealerfleet.domain.dealer;

import java.util.Set;

import com.dealerfleet.domain.exception.InvalidValueException;
import com.dealerfleet.domain.shared.Fields;

import lombok.Builder;

@Builder
public record Address(
        Cep cep,
        String street,
        String number,
        String complement,
        String neighborhood,
        String city,
        String state) {

    private static final Set<String> BRAZILIAN_STATES = Set.of(
            "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
            "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO");

    public Address {
        Fields.requiredValue(cep, "CEP");
        street = Fields.required(street, "Logradouro");
        neighborhood = Fields.required(neighborhood, "Bairro");
        city = Fields.required(city, "Cidade");
        state = validState(state);
        number = Fields.optional(number);
        complement = Fields.optional(complement);
    }

    private static String validState(String value) {
        String normalized = Fields.required(value, "Estado").toUpperCase();
        if (!BRAZILIAN_STATES.contains(normalized)) {
            throw new InvalidValueException("Estado invalido: " + value);
        }
        return normalized;
    }
}
