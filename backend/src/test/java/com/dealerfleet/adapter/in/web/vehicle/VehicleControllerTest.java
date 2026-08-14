package com.dealerfleet.adapter.in.web.vehicle;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
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

import com.dealerfleet.application.port.in.ManageVehicleUseCase;
import com.dealerfleet.domain.exception.BusinessRuleException;
import com.dealerfleet.domain.exception.NotFoundException;
import com.dealerfleet.domain.vehicle.FuelType;
import com.dealerfleet.domain.vehicle.Vehicle;
import com.dealerfleet.domain.vehicle.VehicleSpec;

@WebMvcTest(VehicleController.class)
class VehicleControllerTest {

    private static final UUID ID = UUID.fromString("2a7b3c4d-5e6f-4a1b-8c9d-0e1f2a3b4c5d");
    private static final UUID DEALER_ID = UUID.fromString("6f1c4d1e-6f4d-4a4b-9c2f-2c9d8f0b1a21");
    private static final String CHASSIS = "9BWZZZ377VT004251";

    @Autowired
    private MockMvcTester mvc;

    @MockitoBean
    private ManageVehicleUseCase vehicles;

    private static VehicleSpec spec() {
        return VehicleSpec.builder()
                .brand("Fiat")
                .model("Argo")
                .fuelType(FuelType.FLEX)
                .color("Prata")
                .year(2025)
                .chassis(CHASSIS)
                .price(new BigDecimal("94990.00"))
                .build();
    }

    private static Vehicle vehicle(UUID dealerId) {
        return Vehicle.restore(ID, spec(), dealerId);
    }

    private static String body(String brand, String fuelType, String chassis, String price, String dealerId) {
        return """
                {
                  "brand": "%s",
                  "model": "Argo",
                  "fuelType": "%s",
                  "color": "Prata",
                  "year": 2025,
                  "chassis": %s,
                  "price": %s,
                  "dealerId": %s
                }
                """.formatted(brand, fuelType, chassis, price, dealerId);
    }

    private static String validBody() {
        return body("Fiat", "FLEX", "\"" + CHASSIS + "\"", "94990.00", "null");
    }

    @Test
    @DisplayName("GET /vehicles lista os veiculos cadastrados")
    void findAllReturnsVehicles() {
        when(vehicles.findAll()).thenReturn(List.of(vehicle(DEALER_ID)));

        assertThat(mvc.get().uri("/vehicles"))
                .hasStatusOk()
                .bodyJson()
                .extractingPath("$[0].model").isEqualTo("Argo");
    }

    @Test
    @DisplayName("GET /vehicles/{id} devolve o veiculo com o combustivel como texto do enum")
    void findByIdReturnsVehicle() {
        when(vehicles.findById(ID)).thenReturn(vehicle(null));

        assertThat(mvc.get().uri("/vehicles/{id}", ID))
                .hasStatusOk()
                .bodyJson()
                .extractingPath("$.fuelType").isEqualTo("FLEX");

        assertThat(mvc.get().uri("/vehicles/{id}", ID))
                .bodyJson()
                .extractingPath("$.dealerId").isNull();
    }

    @Test
    @DisplayName("GET /vehicles/{id} inexistente vira 404")
    void findByIdUnknownReturnsNotFound() {
        when(vehicles.findById(ID)).thenThrow(NotFoundException.vehicle(ID));

        assertThat(mvc.get().uri("/vehicles/{id}", ID))
                .hasStatus(HttpStatus.NOT_FOUND)
                .bodyJson()
                .extractingPath("$.detail").asString().contains(ID.toString());
    }

    @Test
    @DisplayName("falha inesperada vira 500 sem vazar o detalhe interno para o cliente")
    void unexpectedFailureReturnsInternalServerError() {
        when(vehicles.findAll()).thenThrow(new IllegalStateException("conexao com o banco perdida"));

        assertThat(mvc.get().uri("/vehicles"))
                .hasStatus(HttpStatus.INTERNAL_SERVER_ERROR)
                .bodyJson()
                .extractingPath("$.detail").isEqualTo("Ocorreu um erro inesperado ao processar a requisicao");

        assertThat(mvc.get().uri("/vehicles"))
                .bodyText().doesNotContain("conexao com o banco perdida");
    }

    @Test
    @DisplayName("POST /vehicles devolve 201 com Location do recurso criado")
    void createReturnsCreatedWithLocation() {
        when(vehicles.create(any(), any())).thenReturn(vehicle(null));

        assertThat(mvc.post().uri("/vehicles").contentType(MediaType.APPLICATION_JSON).content(validBody()))
                .hasStatus(HttpStatus.CREATED)
                .hasHeader("Location", "/vehicles/" + ID)
                .bodyJson()
                .extractingPath("$.id").isEqualTo(ID.toString());
    }

    @Test
    @DisplayName("POST /vehicles monta a especificacao e o vinculo a partir do corpo")
    void createSendsSpecAndDealerToUseCase() {
        when(vehicles.create(any(), any())).thenReturn(vehicle(DEALER_ID));
        ArgumentCaptor<VehicleSpec> spec = ArgumentCaptor.forClass(VehicleSpec.class);

        assertThat(mvc.post().uri("/vehicles").contentType(MediaType.APPLICATION_JSON)
                .content(body("Fiat", "FLEX", "\"" + CHASSIS + "\"", "94990.00", "\"" + DEALER_ID + "\"")))
                .hasStatus(HttpStatus.CREATED);

        verify(vehicles).create(spec.capture(), eq(DEALER_ID));
        assertThat(spec.getValue().chassis()).isEqualTo(CHASSIS);
        assertThat(spec.getValue().fuelType()).isEqualTo(FuelType.FLEX);
        assertThat(spec.getValue().price()).isEqualByComparingTo("94990.00");
    }

    @Test
    @DisplayName("POST /vehicles sem marca devolve o erro no campo")
    void createWithoutBrandReturnsFieldError() {
        assertThat(mvc.post().uri("/vehicles").contentType(MediaType.APPLICATION_JSON)
                .content(body("", "FLEX", "null", "null", "null")))
                .hasStatus(HttpStatus.BAD_REQUEST)
                .bodyJson()
                .extractingPath("$.errors.brand").asString().isNotEmpty();

        verify(vehicles, never()).create(any(), any());
    }

    @Test
    @DisplayName("POST /vehicles com combustivel fora do enum devolve 400")
    void createWithUnknownFuelTypeReturnsBadRequest() {
        assertThat(mvc.post().uri("/vehicles").contentType(MediaType.APPLICATION_JSON)
                .content(body("Fiat", "ALCOOL", "null", "null", "null")))
                .hasStatus(HttpStatus.BAD_REQUEST)
                .bodyJson()
                .extractingPath("$.title").isEqualTo("Requisicao malformada");

        verify(vehicles, never()).create(any(), any());
    }

    @Test
    @DisplayName("POST /vehicles com valor negativo devolve o erro no campo")
    void createWithNegativePriceReturnsFieldError() {
        assertThat(mvc.post().uri("/vehicles").contentType(MediaType.APPLICATION_JSON)
                .content(body("Fiat", "FLEX", "null", "-1", "null")))
                .hasStatus(HttpStatus.BAD_REQUEST)
                .bodyJson()
                .extractingPath("$.errors.price").asString().isNotEmpty();
    }

    @Test
    @DisplayName("POST /vehicles com chassi de tamanho invalido devolve o erro no campo")
    void createWithShortChassisReturnsFieldError() {
        assertThat(mvc.post().uri("/vehicles").contentType(MediaType.APPLICATION_JSON)
                .content(body("Fiat", "FLEX", "\"9BWZZZ377VT0042\"", "null", "null")))
                .hasStatus(HttpStatus.BAD_REQUEST)
                .bodyJson()
                .extractingPath("$.errors.chassis").asString().isNotEmpty();
    }

    @Test
    @DisplayName("POST /vehicles com chassi ja cadastrado devolve 409")
    void createWithDuplicatedChassisReturnsConflict() {
        when(vehicles.create(any(), any()))
                .thenThrow(new BusinessRuleException("Chassi ja cadastrado: " + CHASSIS));

        assertThat(mvc.post().uri("/vehicles").contentType(MediaType.APPLICATION_JSON).content(validBody()))
                .hasStatus(HttpStatus.CONFLICT)
                .bodyJson()
                .extractingPath("$.title").isEqualTo("Regra de negocio violada");
    }

    @Test
    @DisplayName("PUT /vehicles/{id} devolve o veiculo atualizado")
    void updateReturnsUpdatedVehicle() {
        when(vehicles.update(eq(ID), any(), any())).thenReturn(vehicle(DEALER_ID));

        assertThat(mvc.put().uri("/vehicles/{id}", ID).contentType(MediaType.APPLICATION_JSON).content(validBody()))
                .hasStatusOk()
                .bodyJson()
                .extractingPath("$.dealerId").isEqualTo(DEALER_ID.toString());
    }

    @Test
    @DisplayName("PUT /vehicles/{id} com concessionaria inexistente devolve 404")
    void updateWithUnknownDealerReturnsNotFound() {
        when(vehicles.update(eq(ID), any(), any())).thenThrow(NotFoundException.dealer(DEALER_ID));

        assertThat(mvc.put().uri("/vehicles/{id}", ID).contentType(MediaType.APPLICATION_JSON).content(validBody()))
                .hasStatus(HttpStatus.NOT_FOUND);
    }

    @Test
    @DisplayName("DELETE /vehicles/{id} devolve 204 sem corpo")
    void deleteReturnsNoContent() {
        assertThat(mvc.delete().uri("/vehicles/{id}", ID)).hasStatus(HttpStatus.NO_CONTENT);

        verify(vehicles).delete(ID);
    }

    @Test
    @DisplayName("PUT /vehicles/{id}/dealer vincula o veiculo a concessionaria")
    void assignDealerReturnsLinkedVehicle() {
        when(vehicles.assignToDealer(ID, DEALER_ID)).thenReturn(vehicle(DEALER_ID));

        assertThat(mvc.put().uri("/vehicles/{id}/dealer", ID).contentType(MediaType.APPLICATION_JSON)
                .content("{\"dealerId\": \"%s\"}".formatted(DEALER_ID)))
                .hasStatusOk()
                .bodyJson()
                .extractingPath("$.dealerId").isEqualTo(DEALER_ID.toString());
    }

    @Test
    @DisplayName("PUT /vehicles/{id}/dealer sem concessionaria devolve o erro no campo")
    void assignDealerWithoutDealerIdReturnsFieldError() {
        assertThat(mvc.put().uri("/vehicles/{id}/dealer", ID).contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
                .hasStatus(HttpStatus.BAD_REQUEST)
                .bodyJson()
                .extractingPath("$.errors.dealerId").asString().isNotEmpty();

        verify(vehicles, never()).assignToDealer(any(), any());
    }

    @Test
    @DisplayName("DELETE /vehicles/{id}/dealer devolve o veiculo sem vinculo")
    void unassignDealerReturnsUnlinkedVehicle() {
        when(vehicles.unassignFromDealer(ID)).thenReturn(vehicle(null));

        assertThat(mvc.delete().uri("/vehicles/{id}/dealer", ID))
                .hasStatusOk()
                .bodyJson()
                .extractingPath("$.dealerId").isNull();
    }
}
