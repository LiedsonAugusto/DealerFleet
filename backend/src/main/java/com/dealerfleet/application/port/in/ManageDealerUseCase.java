package com.dealerfleet.application.port.in;

import java.util.List;
import java.util.UUID;

import com.dealerfleet.domain.dealer.Address;
import com.dealerfleet.domain.dealer.Cnpj;
import com.dealerfleet.domain.dealer.Dealer;

public interface ManageDealerUseCase {

    Dealer create(String corporateName, Cnpj cnpj, Address address);

    Dealer update(UUID id, String corporateName, Cnpj cnpj, Address address);

    void delete(UUID id);

    Dealer findById(UUID id);

    List<Dealer> findAll();
}
