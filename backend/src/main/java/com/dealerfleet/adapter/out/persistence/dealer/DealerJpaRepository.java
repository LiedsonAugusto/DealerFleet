package com.dealerfleet.adapter.out.persistence.dealer;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

interface DealerJpaRepository extends JpaRepository<DealerJpaEntity, UUID> {

    Optional<DealerJpaEntity> findByCnpj(String cnpj);
}
