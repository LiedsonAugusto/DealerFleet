package com.dealerfleet.adapter.in.web.dealer;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.assertj.MockMvcTester;

import com.dealerfleet.application.port.in.ManageDealerUseCase;
import com.dealerfleet.application.port.in.ManageVehicleUseCase;
import com.dealerfleet.domain.dealer.Address;
import com.dealerfleet.domain.dealer.Cep;
import com.dealerfleet.domain.dealer.Cnpj;
import com.dealerfleet.domain.dealer.Dealer;
import com.dealerfleet.domain.exception.BusinessRuleException;
import com.dealerfleet.domain.exception.NotFoundException;
import com.dealerfleet.domain.vehicle.FuelType;
import com.dealerfleet.domain.vehicle.Vehicle;
import com.dealerfleet.domain.vehicle.VehicleSpec;

@WebMvcTest(DealerController.class)
class DealerControllerTest {

    private static final UUID ID = UUID.fromString("6f1c4d1e-6f4d-4a4b-9c2f-2c9d8f0b1a21");
    private static final String NAME = "Concessionaria Centro LTDA";
    private static final String CNPJ = "11222333000181";

    @Autowired
    private MockMvcTester mvc;

    @MockitoBean
    private ManageDealerUseCase dealers;

    @MockitoBean
    private ManageVehicleUseCase vehicles;

    private static Address address() {
        return Address.builder()
                .cep(new Cep("58400500"))
                .street("Rua Jose de Alencar")
                .number("220")
                .neighborhood("Prata")
                .city("Campina Grande")
                .state("PB")
                .build();
    }

    private static Dealer dealer() {
        return Dealer.restore(ID, NAME, new Cnpj(CNPJ), address());
    }

    private static String body(String corporateName, String cnpj) {
        return """
                {
                  "corporateName": "%s",
                  "cnpj": "%s",
                  "address": {
                    "cep": "58400-500",
                    "street": "Rua Jose de Alencar",
                    "number": "220",
                    "neighborhood": "Prata",
                    "city": "Campina Grande",
                    "state": "PB"
                  }
                }
                """.formatted(corporateName, cnpj);
    }

    private static String validBody() {
        return body(NAME, "11.222.333/0001-81");
    }

    @Test
    @DisplayName("GET /dealer devolve a lista com CNPJ e CEP formatados")
    void findAllReturnsFormattedValues() {
        when(dealers.findAll()).thenReturn(List.of(dealer()));

        assertThat(mvc.get().uri("/dealer"))
                .hasStatusOk()
                .bodyJson()
                .extractingPath("$[0].cnpj").isEqualTo(CNPJ);

        assertThat(mvc.get().uri("/dealer"))
                .bodyJson()
                .extractingPath("$[0].cnpjFormatted").isEqualTo("11.222.333/0001-81");

        assertThat(mvc.get().uri("/dealer"))
                .bodyJson()
                .extractingPath("$[0].address.cepFormatted").isEqualTo("58400-500");
    }

    @Test
    @DisplayName("GET /dealer/{id} devolve a concessionaria consultada")
    void findByIdReturnsDealer() {
        when(dealers.findById(ID)).thenReturn(dealer());

        assertThat(mvc.get().uri("/dealer/{id}", ID))
                .hasStatusOk()
                .bodyJson()
                .extractingPath("$.corporateName").isEqualTo(NAME);
    }

    @Test
    @DisplayName("GET /dealer traz o total de veiculos de cada concessionaria")
    void findAllReturnsVehicleCount() {
        when(dealers.findAll()).thenReturn(List.of(dealer()));
        when(vehicles.countByDealers(List.of(ID))).thenReturn(Map.of(ID, 7L));

        assertThat(mvc.get().uri("/dealer"))
                .hasStatusOk()
                .bodyJson()
                .extractingPath("$[0].vehicleCount").isEqualTo(7);
    }

    @Test
    @DisplayName("GET /dealer conta os veiculos em uma consulta unica, sem uma por concessionaria")
    void findAllCountsInSingleQuery() {
        when(dealers.findAll()).thenReturn(List.of(dealer()));
        when(vehicles.countByDealers(any())).thenReturn(Map.of());

        assertThat(mvc.get().uri("/dealer")).hasStatusOk()
                .bodyJson()
                .extractingPath("$[0].vehicleCount").isEqualTo(0);

        verify(vehicles).countByDealers(List.of(ID));
        verify(vehicles, never()).countByDealer(any());
    }

    @Test
    @DisplayName("GET /dealer/{id} traz o total de veiculos vinculados")
    void findByIdReturnsVehicleCount() {
        when(dealers.findById(ID)).thenReturn(dealer());
        when(vehicles.countByDealer(ID)).thenReturn(4L);

        assertThat(mvc.get().uri("/dealer/{id}", ID))
                .hasStatusOk()
                .bodyJson()
                .extractingPath("$.vehicleCount").isEqualTo(4);
    }

    @Test
    @DisplayName("POST /dealer devolve a concessionaria nova sem veiculos")
    void createReturnsZeroVehicleCount() {
        when(dealers.create(any(), any(), any())).thenReturn(dealer());

        assertThat(mvc.post().uri("/dealer").contentType(MediaType.APPLICATION_JSON).content(validBody()))
                .hasStatus(HttpStatus.CREATED)
                .bodyJson()
                .extractingPath("$.vehicleCount").isEqualTo(0);

        verify(vehicles, never()).countByDealer(any());
    }

    @Test
    @DisplayName("GET /dealer/{id} inexistente vira 404 com problem detail")
    void findByIdUnknownReturnsNotFound() {
        when(dealers.findById(ID)).thenThrow(NotFoundException.dealer(ID));

        assertThat(mvc.get().uri("/dealer/{id}", ID))
                .hasStatus(HttpStatus.NOT_FOUND)
                .hasContentType(MediaType.APPLICATION_PROBLEM_JSON)
                .bodyJson()
                .extractingPath("$.title").isEqualTo("Registro nao encontrado");
    }

    @Test
    @DisplayName("GET /dealer/{id} com identificador malformado vira 400")
    void findByIdWithInvalidIdentifierReturnsBadRequest() {
        assertThat(mvc.get().uri("/dealer/{id}", "nao-e-uuid"))
                .hasStatus(HttpStatus.BAD_REQUEST)
                .bodyJson()
                .extractingPath("$.title").isEqualTo("Parametro invalido");

        verify(dealers, never()).findById(any());
    }

    @Test
    @DisplayName("POST /dealer devolve 201 com Location do recurso criado")
    void createReturnsCreatedWithLocation() {
        when(dealers.create(any(), any(), any())).thenReturn(dealer());

        assertThat(mvc.post().uri("/dealer").contentType(MediaType.APPLICATION_JSON).content(validBody()))
                .hasStatus(HttpStatus.CREATED)
                .hasHeader("Location", "/dealer/" + ID)
                .bodyJson()
                .extractingPath("$.id").isEqualTo(ID.toString());
    }

    @Test
    @DisplayName("POST /dealer entrega CNPJ e CEP sem mascara para o caso de uso")
    void createSendsUnmaskedValuesToUseCase() {
        when(dealers.create(any(), any(), any())).thenReturn(dealer());
        ArgumentCaptor<Cnpj> cnpj = ArgumentCaptor.forClass(Cnpj.class);
        ArgumentCaptor<Address> address = ArgumentCaptor.forClass(Address.class);

        assertThat(mvc.post().uri("/dealer").contentType(MediaType.APPLICATION_JSON).content(validBody()))
                .hasStatus(HttpStatus.CREATED);

        verify(dealers).create(eq(NAME), cnpj.capture(), address.capture());
        assertThat(cnpj.getValue().value()).isEqualTo(CNPJ);
        assertThat(address.getValue().cep().value()).isEqualTo("58400500");
    }

    @Test
    @DisplayName("POST /dealer sem razao social devolve o erro no campo")
    void createWithoutCorporateNameReturnsFieldError() {
        assertThat(mvc.post().uri("/dealer").contentType(MediaType.APPLICATION_JSON)
                .content(body("", "11.222.333/0001-81")))
                .hasStatus(HttpStatus.BAD_REQUEST)
                .bodyJson()
                .extractingPath("$.errors.corporateName").asString().isNotEmpty();

        verify(dealers, never()).create(any(), any(), any());
    }

    @Test
    @DisplayName("POST /dealer com digito verificador invalido devolve 400")
    void createWithInvalidCnpjReturnsBadRequest() {
        assertThat(mvc.post().uri("/dealer").contentType(MediaType.APPLICATION_JSON)
                .content(body(NAME, "11.222.333/0001-99")))
                .hasStatus(HttpStatus.BAD_REQUEST)
                .bodyJson()
                .extractingPath("$.detail").isEqualTo("CNPJ invalido");

        verify(dealers, never()).create(any(), any(), any());
    }

    @Test
    @DisplayName("POST /dealer com CNPJ ja cadastrado devolve 409")
    void createWithDuplicatedCnpjReturnsConflict() {
        when(dealers.create(any(), any(), any()))
                .thenThrow(new BusinessRuleException("CNPJ ja cadastrado: 11.222.333/0001-81"));

        assertThat(mvc.post().uri("/dealer").contentType(MediaType.APPLICATION_JSON).content(validBody()))
                .hasStatus(HttpStatus.CONFLICT)
                .bodyJson()
                .extractingPath("$.title").isEqualTo("Regra de negocio violada");
    }

    @Test
    @DisplayName("POST /dealer com corpo ilegivel devolve 400")
    void createWithMalformedBodyReturnsBadRequest() {
        assertThat(mvc.post().uri("/dealer").contentType(MediaType.APPLICATION_JSON).content("{"))
                .hasStatus(HttpStatus.BAD_REQUEST)
                .bodyJson()
                .extractingPath("$.title").isEqualTo("Requisicao malformada");
    }

    @Test
    @DisplayName("PUT /dealer/{id} devolve a concessionaria atualizada")
    void updateReturnsUpdatedDealer() {
        when(dealers.update(eq(ID), any(), any(), any())).thenReturn(dealer());

        assertThat(mvc.put().uri("/dealer/{id}", ID).contentType(MediaType.APPLICATION_JSON).content(validBody()))
                .hasStatusOk()
                .bodyJson()
                .extractingPath("$.id").isEqualTo(ID.toString());
    }

    @Test
    @DisplayName("DELETE /dealer/{id} devolve 204 sem corpo")
    void deleteReturnsNoContent() {
        assertThat(mvc.delete().uri("/dealer/{id}", ID)).hasStatus(HttpStatus.NO_CONTENT);

        verify(dealers).delete(ID);
    }

    @Test
    @DisplayName("DELETE /dealer/{id} com veiculos vinculados devolve 409")
    void deleteWithLinkedVehiclesReturnsConflict() {
        doThrow(new BusinessRuleException("Concessionaria possui 3 veiculo(s) vinculado(s)."))
                .when(dealers).delete(ID);

        assertThat(mvc.delete().uri("/dealer/{id}", ID))
                .hasStatus(HttpStatus.CONFLICT)
                .bodyJson()
                .extractingPath("$.detail").asString().contains("3 veiculo(s)");
    }

    @Test
    @DisplayName("GET /dealer/{id}/vehicles lista a frota da concessionaria")
    void findVehiclesReturnsDealerFleet() {
        Vehicle vehicle = Vehicle.create(VehicleSpec.builder()
                .brand("Fiat")
                .model("Argo")
                .fuelType(FuelType.FLEX)
                .color("Prata")
                .build(), ID);
        when(vehicles.findByDealer(ID)).thenReturn(List.of(vehicle));

        assertThat(mvc.get().uri("/dealer/{id}/vehicles", ID))
                .hasStatusOk()
                .bodyJson()
                .extractingPath("$[0].dealerId").isEqualTo(ID.toString());
    }
}
