package com.dealerfleet.application.port.in;

import com.dealerfleet.domain.dealer.AddressLookup;
import com.dealerfleet.domain.dealer.Cep;

public interface LookupAddressUseCase {

    AddressLookup findByCep(Cep cep);
}
