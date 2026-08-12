package com.dealerfleet.adapter.in.web.dealer;

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

import com.dealerfleet.adapter.in.web.vehicle.VehicleResponse;
import com.dealerfleet.application.port.in.ManageDealerUseCase;
import com.dealerfleet.application.port.in.ManageVehicleUseCase;
import com.dealerfleet.domain.dealer.Dealer;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;

@Tag(name = "Concessionarias")
@RestController
@RequestMapping("/dealer")
@RequiredArgsConstructor
class DealerController {

    private final ManageDealerUseCase dealers;
    private final ManageVehicleUseCase vehicles;

    @GetMapping
    @Operation(summary = "Lista todas as concessionarias")
    List<DealerResponse> findAll() {
        return dealers.findAll().stream().map(DealerResponse::from).toList();
    }

    @GetMapping("/{id}")
    @Operation(summary = "Consulta uma concessionaria por identificador")
    DealerResponse findById(@PathVariable UUID id) {
        return DealerResponse.from(dealers.findById(id));
    }

    @PostMapping
    @Operation(summary = "Cadastra uma concessionaria")
    ResponseEntity<DealerResponse> create(@Valid @RequestBody DealerRequest request) {
        Dealer created = dealers.create(request.corporateName(), request.toCnpj(), request.address().toAddress());

        return ResponseEntity
                .created(URI.create("/dealer/" + created.getId()))
                .body(DealerResponse.from(created));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualiza uma concessionaria")
    DealerResponse update(@PathVariable UUID id, @Valid @RequestBody DealerRequest request) {
        return DealerResponse.from(
                dealers.update(id, request.corporateName(), request.toCnpj(), request.address().toAddress()));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Exclui uma concessionaria sem veiculos vinculados")
    void delete(@PathVariable UUID id) {
        dealers.delete(id);
    }

    @GetMapping("/{id}/vehicles")
    @Operation(summary = "Lista os veiculos de uma concessionaria")
    List<VehicleResponse> findVehicles(@PathVariable UUID id) {
        return vehicles.findByDealer(id).stream().map(VehicleResponse::from).toList();
    }
}
