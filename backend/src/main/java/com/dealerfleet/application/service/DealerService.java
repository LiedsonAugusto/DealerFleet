package com.dealerfleet.application.service;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.dealerfleet.application.port.in.ManageDealerUseCase;
import com.dealerfleet.application.port.out.DealerRepositoryPort;
import com.dealerfleet.application.port.out.VehicleRepositoryPort;
import com.dealerfleet.domain.dealer.Address;
import com.dealerfleet.domain.dealer.Cnpj;
import com.dealerfleet.domain.dealer.Dealer;
import com.dealerfleet.domain.exception.BusinessRuleException;
import com.dealerfleet.domain.exception.NotFoundException;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class DealerService implements ManageDealerUseCase {

    private final DealerRepositoryPort dealers;
    private final VehicleRepositoryPort vehicles;

    @Override
    public Dealer create(String corporateName, Cnpj cnpj, Address address) {
        requireAvailableCnpj(cnpj, null);

        Dealer dealer = Dealer.create(corporateName, cnpj, address);
        log.info("Cadastrando concessionaria cnpj={} id={}", cnpj.formatted(), dealer.getId());
        return dealers.save(dealer);
    }

    @Override
    public Dealer update(UUID id, String corporateName, Cnpj cnpj, Address address) {
        Dealer dealer = requireDealer(id);
        requireAvailableCnpj(cnpj, id);

        dealer.update(corporateName, cnpj, address);
        log.info("Atualizando concessionaria id={}", id);
        return dealers.save(dealer);
    }

    @Override
    public void delete(UUID id) {
        requireDealer(id);

        long linked = vehicles.countByDealerId(id);
        if (linked > 0) {
            throw new BusinessRuleException(
                    "Concessionaria possui %d veiculo(s) vinculado(s). Desvincule antes de excluir.".formatted(linked));
        }

        log.info("Excluindo concessionaria id={}", id);
        dealers.deleteById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public Dealer findById(UUID id) {
        return requireDealer(id);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Dealer> findAll() {
        return dealers.findAll();
    }

    private Dealer requireDealer(UUID id) {
        return dealers.findById(id).orElseThrow(() -> NotFoundException.dealer(id));
    }

    private void requireAvailableCnpj(Cnpj cnpj, UUID currentId) {
        if (cnpj == null) {
            return;
        }
        dealers.findByCnpj(cnpj)
                .filter(found -> !found.getId().equals(currentId))
                .ifPresent(found -> {
                    throw new BusinessRuleException("CNPJ ja cadastrado: " + cnpj.formatted());
                });
    }
}
