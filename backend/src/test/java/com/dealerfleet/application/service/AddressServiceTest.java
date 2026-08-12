package com.dealerfleet.application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.dealerfleet.application.port.out.AddressLookupPort;
import com.dealerfleet.domain.dealer.AddressLookup;
import com.dealerfleet.domain.dealer.Cep;
import com.dealerfleet.domain.exception.NotFoundException;

@ExtendWith(MockitoExtension.class)
class AddressServiceTest {

    private static final Cep CEP = new Cep("58400-500");

    @Mock
    private AddressLookupPort addresses;

    @InjectMocks
    private AddressService service;

    @Test
    @DisplayName("devolve o endereco sugerido pelo provedor")
    void returnsLookup() {
        AddressLookup expected = new AddressLookup(
                CEP, "Rua Jose de Alencar", "Prata", "Campina Grande", "PB");
        when(addresses.findByCep(CEP)).thenReturn(Optional.of(expected));

        assertThat(service.findByCep(CEP)).isEqualTo(expected);
    }

    @Test
    @DisplayName("CEP sem resultado no provedor resulta em erro de nao encontrado")
    void notFoundBecomesError() {
        when(addresses.findByCep(CEP)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.findByCep(CEP))
                .isInstanceOf(NotFoundException.class)
                .hasMessageContaining("58400-500");
    }
}
