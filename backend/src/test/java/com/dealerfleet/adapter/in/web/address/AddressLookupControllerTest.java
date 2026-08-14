package com.dealerfleet.adapter.in.web.address;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.assertj.MockMvcTester;

import com.dealerfleet.application.exception.ExternalServiceException;
import com.dealerfleet.application.port.in.LookupAddressUseCase;
import com.dealerfleet.domain.dealer.AddressLookup;
import com.dealerfleet.domain.dealer.Cep;
import com.dealerfleet.domain.exception.NotFoundException;

@WebMvcTest(AddressLookupController.class)
class AddressLookupControllerTest {

    private static final Cep CEP = new Cep("58400500");

    @Autowired
    private MockMvcTester mvc;

    @MockitoBean
    private LookupAddressUseCase addresses;

    private static AddressLookup lookup() {
        return new AddressLookup(CEP, "Rua Jose de Alencar", "Prata", "Campina Grande", "PB");
    }

    @Test
    @DisplayName("GET /cep/{cep} devolve o endereco sugerido com o CEP formatado")
    void findByCepReturnsAddress() {
        when(addresses.findByCep(CEP)).thenReturn(lookup());

        assertThat(mvc.get().uri("/cep/{cep}", "58400500"))
                .hasStatusOk()
                .bodyJson()
                .extractingPath("$.cepFormatted").isEqualTo("58400-500");

        assertThat(mvc.get().uri("/cep/{cep}", "58400500"))
                .bodyJson()
                .extractingPath("$.city").isEqualTo("Campina Grande");
    }

    @Test
    @DisplayName("GET /cep/{cep} aceita o CEP com mascara")
    void findByCepAcceptsMaskedValue() {
        when(addresses.findByCep(CEP)).thenReturn(lookup());
        ArgumentCaptor<Cep> cep = ArgumentCaptor.forClass(Cep.class);

        assertThat(mvc.get().uri("/cep/{cep}", "58400-500")).hasStatusOk();

        verify(addresses).findByCep(cep.capture());
        assertThat(cep.getValue().value()).isEqualTo("58400500");
    }

    @Test
    @DisplayName("GET /cep/{cep} sem resultado no provedor devolve 404")
    void findByCepWithoutResultReturnsNotFound() {
        when(addresses.findByCep(CEP)).thenThrow(new NotFoundException("CEP nao encontrado: 58400-500"));

        assertThat(mvc.get().uri("/cep/{cep}", "58400500"))
                .hasStatus(HttpStatus.NOT_FOUND)
                .hasContentType(MediaType.APPLICATION_PROBLEM_JSON)
                .bodyJson()
                .extractingPath("$.title").isEqualTo("Registro nao encontrado");
    }

    @Test
    @DisplayName("GET /cep/{cep} com quantidade invalida de digitos devolve 400")
    void findByCepWithInvalidLengthReturnsBadRequest() {
        assertThat(mvc.get().uri("/cep/{cep}", "584005"))
                .hasStatus(HttpStatus.BAD_REQUEST)
                .bodyJson()
                .extractingPath("$.detail").isEqualTo("CEP deve conter 8 digitos");

        verify(addresses, never()).findByCep(any());
    }

    @Test
    @DisplayName("GET /cep/{cep} com o ViaCEP indisponivel devolve 503")
    void findByCepWithProviderDownReturnsServiceUnavailable() {
        when(addresses.findByCep(CEP)).thenThrow(
                new ExternalServiceException("Servico de consulta de CEP indisponivel", new RuntimeException()));

        assertThat(mvc.get().uri("/cep/{cep}", "58400500"))
                .hasStatus(HttpStatus.SERVICE_UNAVAILABLE)
                .bodyJson()
                .extractingPath("$.title").isEqualTo("Servico externo indisponivel");
    }
}
