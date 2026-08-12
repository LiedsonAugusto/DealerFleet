package com.dealerfleet.adapter.out.viacep;

import java.util.Optional;

import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import com.dealerfleet.application.exception.ExternalServiceException;
import com.dealerfleet.application.port.out.AddressLookupPort;
import com.dealerfleet.domain.dealer.AddressLookup;
import com.dealerfleet.domain.dealer.Cep;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
class ViaCepAdapter implements AddressLookupPort {

    private final RestClient client;

    ViaCepAdapter(RestClient viaCepRestClient) {
        this.client = viaCepRestClient;
    }

    @Override
    public Optional<AddressLookup> findByCep(Cep cep) {
        ViaCepResponse response = fetch(cep);

        if (response == null || response.notFound()) {
            log.info("CEP nao encontrado no ViaCEP cep={}", cep.value());
            return Optional.empty();
        }

        return Optional.of(new AddressLookup(
                cep,
                response.logradouro(),
                response.bairro(),
                response.localidade(),
                response.uf()));
    }

    private ViaCepResponse fetch(Cep cep) {
        try {
            return client.get()
                    .uri("/{cep}/json/", cep.value())
                    .retrieve()
                    .body(ViaCepResponse.class);
        } catch (RestClientException e) {
            log.error("Falha ao consultar ViaCEP cep={}", cep.value(), e);
            throw new ExternalServiceException("Servico de consulta de CEP indisponivel", e);
        }
    }
}
