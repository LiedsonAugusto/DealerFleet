package com.dealerfleet.adapter.in.web.address;

import com.dealerfleet.domain.dealer.AddressLookup;

public record AddressLookupResponse(
        String cep,
        String cepFormatted,
        String street,
        String neighborhood,
        String city,
        String state) {

    public static AddressLookupResponse from(AddressLookup lookup) {
        return new AddressLookupResponse(
                lookup.cep().value(),
                lookup.cep().formatted(),
                lookup.street(),
                lookup.neighborhood(),
                lookup.city(),
                lookup.state());
    }
}
