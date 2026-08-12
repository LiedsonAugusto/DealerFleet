package com.dealerfleet.adapter.in.web.vehicle;

import java.net.URI;
import java.util.List;
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
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.dealerfleet.application.port.in.ManageVehicleUseCase;
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

    private final ManageVehicleUseCase vehicles;

    @GetMapping
    @Operation(summary = "Lista todos os veiculos")
    List<VehicleResponse> findAll() {
        return vehicles.findAll().stream().map(VehicleResponse::from).toList();
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
}
