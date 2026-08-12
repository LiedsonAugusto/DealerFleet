package com.dealerfleet.application.port.out;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.dealerfleet.domain.dealer.Cnpj;
import com.dealerfleet.domain.dealer.Dealer;

public interface DealerRepositoryPort {

    Dealer save(Dealer dealer);

    Optional<Dealer> findById(UUID id);

    List<Dealer> findAll();

    Optional<Dealer> findByCnpj(Cnpj cnpj);

    boolean existsById(UUID id);

    void deleteById(UUID id);
}
