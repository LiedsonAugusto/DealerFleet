package com.dealerfleet.adapter.in.web.dealer;

import java.util.UUID;

import com.dealerfleet.domain.dealer.Address;
import com.dealerfleet.domain.dealer.Dealer;

public record DealerResponse(
        UUID id,
        String corporateName,
        String cnpj,
        String cnpjFormatted,
        AddressResponse address) {

    public static DealerResponse from(Dealer dealer) {
        Address address = dealer.getAddress();

        return new DealerResponse(
                dealer.getId(),
                dealer.getCorporateName(),
                dealer.getCnpj().value(),
                dealer.getCnpj().formatted(),
                new AddressResponse(
                        address.cep().value(),
                        address.cep().formatted(),
                        address.street(),
                        address.number(),
                        address.complement(),
                        address.neighborhood(),
                        address.city(),
                        address.state()));
    }

    public record AddressResponse(
            String cep,
            String cepFormatted,
            String street,
            String number,
            String complement,
            String neighborhood,
            String city,
            String state) {
    }
}
