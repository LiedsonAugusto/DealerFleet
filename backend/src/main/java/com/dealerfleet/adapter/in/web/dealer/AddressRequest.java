package com.dealerfleet.adapter.in.web.dealer;

import com.dealerfleet.domain.dealer.Address;
import com.dealerfleet.domain.dealer.Cep;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AddressRequest(
        @NotBlank String cep,
        @NotBlank @Size(max = 150) String street,
        @Size(max = 20) String number,
        @Size(max = 100) String complement,
        @NotBlank @Size(max = 100) String neighborhood,
        @NotBlank @Size(max = 100) String city,
        @NotBlank @Size(min = 2, max = 2) String state) {

    public Address toAddress() {
        return Address.builder()
                .cep(new Cep(cep))
                .street(street)
                .number(number)
                .complement(complement)
                .neighborhood(neighborhood)
                .city(city)
                .state(state)
                .build();
    }
}
