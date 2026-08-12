package com.dealerfleet.application.service;

import org.springframework.stereotype.Service;

import com.dealerfleet.application.port.in.LookupAddressUseCase;
import com.dealerfleet.application.port.out.AddressLookupPort;
import com.dealerfleet.domain.dealer.AddressLookup;
import com.dealerfleet.domain.dealer.Cep;
import com.dealerfleet.domain.exception.NotFoundException;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class AddressService implements LookupAddressUseCase {

    private final AddressLookupPort addresses;

    @Override
    public AddressLookup findByCep(Cep cep) {
        log.info("Consultando endereco por cep={}", cep.formatted());
        return addresses.findByCep(cep)
                .orElseThrow(() -> new NotFoundException("CEP nao encontrado: " + cep.formatted()));
    }
}
