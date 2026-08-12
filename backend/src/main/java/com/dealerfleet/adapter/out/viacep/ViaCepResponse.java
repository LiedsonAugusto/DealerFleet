package com.dealerfleet.adapter.out.viacep;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
record ViaCepResponse(
        String logradouro,
        String bairro,
        String localidade,
        String uf,
        Boolean erro) {

    boolean notFound() {
        return Boolean.TRUE.equals(erro) || localidade == null || localidade.isBlank();
    }
}
