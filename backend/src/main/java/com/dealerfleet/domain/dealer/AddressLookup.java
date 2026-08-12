package com.dealerfleet.domain.dealer;

import com.dealerfleet.domain.shared.Fields;

public record AddressLookup(
        Cep cep,
        String street,
        String neighborhood,
        String city,
        String state) {

    public AddressLookup {
        Fields.requiredValue(cep, "CEP");
        street = Fields.optional(street);
        neighborhood = Fields.optional(neighborhood);
        city = Fields.required(city, "Cidade");
        state = Fields.required(state, "Estado").toUpperCase();
    }
}
