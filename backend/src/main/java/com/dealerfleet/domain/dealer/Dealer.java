package com.dealerfleet.domain.dealer;

import java.util.UUID;

import com.dealerfleet.domain.shared.Fields;

import lombok.Getter;

@Getter
public class Dealer {

    private final UUID id;
    private String corporateName;
    private Cnpj cnpj;
    private Address address;

    private Dealer(UUID id, String corporateName, Cnpj cnpj, Address address) {
        this.id = id;
        applyData(corporateName, cnpj, address);
    }

    public static Dealer create(String corporateName, Cnpj cnpj, Address address) {
        return new Dealer(UUID.randomUUID(), corporateName, cnpj, address);
    }

    public static Dealer restore(UUID id, String corporateName, Cnpj cnpj, Address address) {
        return new Dealer(Fields.requiredValue(id, "Id"), corporateName, cnpj, address);
    }

    public void update(String corporateName, Cnpj cnpj, Address address) {
        applyData(corporateName, cnpj, address);
    }

    private void applyData(String corporateName, Cnpj cnpj, Address address) {
        this.corporateName = Fields.required(corporateName, "Razao social");
        this.cnpj = Fields.requiredValue(cnpj, "CNPJ");
        this.address = Fields.requiredValue(address, "Endereco");
    }

    @Override
    public boolean equals(Object other) {
        if (this == other) {
            return true;
        }
        return other instanceof Dealer dealer && id.equals(dealer.id);
    }

    @Override
    public int hashCode() {
        return id.hashCode();
    }
}
