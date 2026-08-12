package com.dealerfleet.adapter.out.persistence.dealer;

import org.springframework.stereotype.Component;

import com.dealerfleet.domain.dealer.Address;
import com.dealerfleet.domain.dealer.Cep;
import com.dealerfleet.domain.dealer.Cnpj;
import com.dealerfleet.domain.dealer.Dealer;

@Component
class DealerMapper {

    Dealer toDomain(DealerJpaEntity entity) {
        AddressEmbeddable address = entity.getAddress();
        return Dealer.restore(
                entity.getId(),
                entity.getCorporateName(),
                new Cnpj(entity.getCnpj()),
                Address.builder()
                        .cep(new Cep(address.getCep()))
                        .street(address.getStreet())
                        .number(address.getNumber())
                        .complement(address.getComplement())
                        .neighborhood(address.getNeighborhood())
                        .city(address.getCity())
                        .state(address.getState())
                        .build());
    }

    DealerJpaEntity toEntity(Dealer dealer) {
        DealerJpaEntity entity = new DealerJpaEntity();
        entity.setId(dealer.getId());
        copy(entity, dealer);
        return entity;
    }

    DealerJpaEntity merge(DealerJpaEntity entity, Dealer dealer) {
        copy(entity, dealer);
        return entity;
    }

    private void copy(DealerJpaEntity entity, Dealer dealer) {
        Address source = dealer.getAddress();
        AddressEmbeddable address = entity.getAddress() == null ? new AddressEmbeddable() : entity.getAddress();

        address.setCep(source.cep().value());
        address.setStreet(source.street());
        address.setNumber(source.number());
        address.setComplement(source.complement());
        address.setNeighborhood(source.neighborhood());
        address.setCity(source.city());
        address.setState(source.state());

        entity.setCorporateName(dealer.getCorporateName());
        entity.setCnpj(dealer.getCnpj().value());
        entity.setAddress(address);
    }
}
