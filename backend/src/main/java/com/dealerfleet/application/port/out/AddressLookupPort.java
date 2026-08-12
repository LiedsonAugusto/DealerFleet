package com.dealerfleet.application.port.out;

import java.util.Optional;

import com.dealerfleet.domain.dealer.AddressLookup;
import com.dealerfleet.domain.dealer.Cep;

public interface AddressLookupPort {

    Optional<AddressLookup> findByCep(Cep cep);
}
