package com.dealerfleet.adapter.out.persistence.dealer;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Embeddable
class AddressEmbeddable {

    @Column(name = "cep", nullable = false, length = 8)
    private String cep;

    @Column(name = "street", nullable = false, length = 150)
    private String street;

    @Column(name = "number", length = 20)
    private String number;

    @Column(name = "complement", length = 100)
    private String complement;

    @Column(name = "neighborhood", nullable = false, length = 100)
    private String neighborhood;

    @Column(name = "city", nullable = false, length = 100)
    private String city;

    @Column(name = "state", nullable = false, length = 2)
    private String state;
}
