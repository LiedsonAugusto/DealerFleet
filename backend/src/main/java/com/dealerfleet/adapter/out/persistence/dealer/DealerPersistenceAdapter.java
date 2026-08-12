package com.dealerfleet.adapter.out.persistence.dealer;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Component;

import com.dealerfleet.application.port.out.DealerRepositoryPort;
import com.dealerfleet.domain.dealer.Cnpj;
import com.dealerfleet.domain.dealer.Dealer;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
class DealerPersistenceAdapter implements DealerRepositoryPort {

    private final DealerJpaRepository dealers;
    private final DealerMapper mapper;

    @Override
    public Dealer save(Dealer dealer) {
        DealerJpaEntity entity = dealers.findById(dealer.getId())
                .map(managed -> mapper.merge(managed, dealer))
                .orElseGet(() -> dealers.save(mapper.toEntity(dealer)));

        return mapper.toDomain(entity);
    }

    @Override
    public Optional<Dealer> findById(UUID id) {
        return dealers.findById(id).map(mapper::toDomain);
    }

    @Override
    public List<Dealer> findAll() {
        return dealers.findAll().stream().map(mapper::toDomain).toList();
    }

    @Override
    public Optional<Dealer> findByCnpj(Cnpj cnpj) {
        return dealers.findByCnpj(cnpj.value()).map(mapper::toDomain);
    }

    @Override
    public boolean existsById(UUID id) {
        return dealers.existsById(id);
    }

    @Override
    public void deleteById(UUID id) {
        dealers.deleteById(id);
    }
}
