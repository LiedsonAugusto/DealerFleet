package com.dealerfleet.adapter.in.web.address;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.dealerfleet.application.port.in.LookupAddressUseCase;
import com.dealerfleet.domain.dealer.Cep;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

import lombok.RequiredArgsConstructor;

@Tag(name = "Enderecos")
@RestController
@RequestMapping("/cep")
@RequiredArgsConstructor
class AddressLookupController {

    private final LookupAddressUseCase addresses;

    @GetMapping("/{cep}")
    @Operation(summary = "Consulta endereco por CEP no ViaCEP")
    AddressLookupResponse findByCep(@PathVariable String cep) {
        return AddressLookupResponse.from(addresses.findByCep(new Cep(cep)));
    }
}
