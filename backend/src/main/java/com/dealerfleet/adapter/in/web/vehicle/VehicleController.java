package com.dealerfleet.adapter.in.web.vehicle;

import java.net.URI;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.dealerfleet.adapter.in.web.PageResponse;
import com.dealerfleet.application.port.PageQuery;
import com.dealerfleet.application.port.VehicleQuery;
import com.dealerfleet.application.port.in.ManageVehicleUseCase;
import com.dealerfleet.domain.exception.InvalidValueException;
import com.dealerfleet.domain.vehicle.FuelType;
import com.dealerfleet.domain.vehicle.Vehicle;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;

@Tag(name = "Veiculos")
@RestController
@RequestMapping("/vehicles")
@RequiredArgsConstructor
class VehicleController {

    private static final String UNASSIGNED = "none";

    private final ManageVehicleUseCase vehicles;

    @GetMapping
    @Operation(summary = "Lista veiculos de forma paginada, com filtros e ordenacao")
    PageResponse<VehicleResponse> search(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) String sort,
            @RequestParam(required = false) String dir,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String brand,
            @RequestParam(required = false) String model,
            @RequestParam(required = false) String color,
            @RequestParam(required = false) String year,
            @RequestParam(required = false) FuelType fuel,
            @RequestParam(required = false) String dealer) {

        VehicleQuery query = new VehicleQuery(q, brand, model, color, year, fuel,
                dealerId(dealer), UNASSIGNED.equalsIgnoreCase(dealer));

        return PageResponse.from(
                vehicles.search(query, PageQuery.of(page, size, sort, dir)),
                VehicleResponse::from);
    }

    @GetMapping("/summary")
    @Operation(summary = "Totaliza a frota inteira, independente da pagina consultada")
    VehicleSummaryResponse summary() {
        return VehicleSummaryResponse.from(vehicles.summary());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Consulta um veiculo por identificador")
    VehicleResponse findById(@PathVariable UUID id) {
        return VehicleResponse.from(vehicles.findById(id));
    }

    @PostMapping
    @Operation(summary = "Cadastra um veiculo")
    ResponseEntity<VehicleResponse> create(@Valid @RequestBody VehicleRequest request) {
        Vehicle created = vehicles.create(request.toSpec(), request.dealerId());

        return ResponseEntity
                .created(URI.create("/vehicles/" + created.getId()))
                .body(VehicleResponse.from(created));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualiza um veiculo, incluindo o vinculo com a concessionaria")
    VehicleResponse update(@PathVariable UUID id, @Valid @RequestBody VehicleRequest request) {
        return VehicleResponse.from(vehicles.update(id, request.toSpec(), request.dealerId()));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Exclui um veiculo")
    void delete(@PathVariable UUID id) {
        vehicles.delete(id);
    }

    @PutMapping("/{id}/dealer")
    @Operation(summary = "Vincula ou troca a concessionaria de um veiculo")
    VehicleResponse assignDealer(@PathVariable UUID id, @Valid @RequestBody AssignDealerRequest request) {
        return VehicleResponse.from(vehicles.assignToDealer(id, request.dealerId()));
    }

    @DeleteMapping("/{id}/dealer")
    @Operation(summary = "Desvincula o veiculo da concessionaria")
    VehicleResponse unassignDealer(@PathVariable UUID id) {
        return VehicleResponse.from(vehicles.unassignFromDealer(id));
    }

    private static UUID dealerId(String dealer) {
        if (dealer == null || dealer.isBlank() || UNASSIGNED.equalsIgnoreCase(dealer)) {
            return null;
        }

        try {
            return UUID.fromString(dealer);
        } catch (IllegalArgumentException exception) {
            throw new InvalidValueException("Valor invalido para o parametro 'dealer'");
        }
    }
}
