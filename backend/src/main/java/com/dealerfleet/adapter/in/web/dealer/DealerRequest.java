package com.dealerfleet.adapter.in.web.dealer;

import com.dealerfleet.domain.dealer.Cnpj;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record DealerRequest(
        @NotBlank @Size(max = 150) String corporateName,
        @NotBlank String cnpj,
        @NotNull @Valid AddressRequest address) {

    public Cnpj toCnpj() {
        return new Cnpj(cnpj);
    }
}
