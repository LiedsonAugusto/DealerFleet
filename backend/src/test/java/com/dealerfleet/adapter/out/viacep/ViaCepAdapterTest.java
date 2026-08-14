package com.dealerfleet.adapter.out.viacep;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withServerError;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import java.net.SocketTimeoutException;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import com.dealerfleet.application.exception.ExternalServiceException;
import com.dealerfleet.domain.dealer.AddressLookup;
import com.dealerfleet.domain.dealer.Cep;

class ViaCepAdapterTest {

    private static final String BASE_URL = "https://viacep.test/ws";
    private static final Cep CEP = new Cep("58400-500");
    private static final String EXPECTED_URI = BASE_URL + "/58400500/json/";

    private static final String FOUND = """
            {
              "cep": "58400-500",
              "logradouro": "Rua Jose de Alencar",
              "complemento": "de 500 a 900",
              "bairro": "Prata",
              "localidade": "Campina Grande",
              "uf": "PB",
              "ibge": "2504009"
            }
            """;

    private MockRestServiceServer server;
    private ViaCepAdapter adapter;

    @BeforeEach
    void setUp() {
        RestClient.Builder builder = RestClient.builder().baseUrl(BASE_URL);
        server = MockRestServiceServer.bindTo(builder).build();
        adapter = new ViaCepAdapter(builder.build());
    }

    private void respondWith(String body) {
        server.expect(requestTo(EXPECTED_URI))
                .andExpect(method(HttpMethod.GET))
                .andRespond(withSuccess(body, MediaType.APPLICATION_JSON));
    }

    @Test
    @DisplayName("consulta a URI /{cep}/json/ com o CEP sem mascara")
    void callsViaCepWithUnmaskedCep() {
        respondWith(FOUND);

        adapter.findByCep(CEP);

        server.verify();
    }

    @Test
    @DisplayName("devolve o endereco quando o ViaCEP encontra o CEP")
    void returnsAddressWhenFound() {
        respondWith(FOUND);

        AddressLookup lookup = adapter.findByCep(CEP).orElseThrow();

        assertThat(lookup.cep()).isEqualTo(CEP);
        assertThat(lookup.street()).isEqualTo("Rua Jose de Alencar");
        assertThat(lookup.neighborhood()).isEqualTo("Prata");
        assertThat(lookup.city()).isEqualTo("Campina Grande");
        assertThat(lookup.state()).isEqualTo("PB");
    }

    @Test
    @DisplayName("ignora campos desconhecidos do provedor sem quebrar a desserializacao")
    void ignoresUnknownFields() {
        respondWith("""
                {
                  "logradouro": "Rua Jose de Alencar",
                  "bairro": "Prata",
                  "localidade": "Campina Grande",
                  "uf": "PB",
                  "campoNovoDoProvedor": "valor inesperado"
                }
                """);

        assertThat(adapter.findByCep(CEP)).isPresent();
    }

    @Test
    @DisplayName("CEP inexistente chega como 200 com erro textual e vira resultado vazio")
    void unknownCepAsTextualErrorBecomesEmpty() {
        respondWith("""
                {
                  "erro": "true"
                }
                """);

        assertThat(adapter.findByCep(CEP)).isEmpty();
    }

    @Test
    @DisplayName("CEP inexistente chega como 200 com erro booleano e vira resultado vazio")
    void unknownCepAsBooleanErrorBecomesEmpty() {
        respondWith("""
                {
                  "erro": true
                }
                """);

        assertThat(adapter.findByCep(CEP)).isEmpty();
    }

    @ParameterizedTest
    @ValueSource(strings = {"null", "\"\"", "\"   \""})
    @DisplayName("resposta sem cidade utilizavel vira resultado vazio")
    void missingCityBecomesEmpty(String localidade) {
        respondWith("""
                {
                  "logradouro": "Rua Jose de Alencar",
                  "bairro": "Prata",
                  "localidade": %s,
                  "uf": "PB"
                }
                """.formatted(localidade));

        assertThat(adapter.findByCep(CEP)).isEmpty();
    }

    @Test
    @DisplayName("corpo vazio vira resultado vazio em vez de NullPointerException")
    void emptyBodyBecomesEmpty() {
        server.expect(requestTo(EXPECTED_URI))
                .andRespond(withStatus(HttpStatus.OK));

        Optional<AddressLookup> lookup = adapter.findByCep(CEP);

        assertThat(lookup).isEmpty();
    }

    @Test
    @DisplayName("erro do servidor vira ExternalServiceException, nao resultado vazio")
    void serverErrorBecomesExternalServiceException() {
        server.expect(requestTo(EXPECTED_URI)).andRespond(withServerError());

        assertThatThrownBy(() -> adapter.findByCep(CEP))
                .isInstanceOf(ExternalServiceException.class)
                .hasMessage("Servico de consulta de CEP indisponivel");
    }

    @Test
    @DisplayName("timeout de rede vira ExternalServiceException preservando a causa")
    void timeoutBecomesExternalServiceException() {
        server.expect(requestTo(EXPECTED_URI)).andRespond(request -> {
            throw new SocketTimeoutException("Read timed out");
        });

        assertThatThrownBy(() -> adapter.findByCep(CEP))
                .isInstanceOf(ExternalServiceException.class)
                .hasRootCauseInstanceOf(SocketTimeoutException.class);
    }
}
