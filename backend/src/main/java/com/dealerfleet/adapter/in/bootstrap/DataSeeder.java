package com.dealerfleet.adapter.in.bootstrap;

import java.math.BigDecimal;
import java.util.UUID;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import com.dealerfleet.application.port.in.ManageDealerUseCase;
import com.dealerfleet.application.port.in.ManageVehicleUseCase;
import com.dealerfleet.domain.dealer.Address;
import com.dealerfleet.domain.dealer.Cep;
import com.dealerfleet.domain.dealer.Cnpj;
import com.dealerfleet.domain.vehicle.FuelType;
import com.dealerfleet.domain.vehicle.VehicleSpec;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.seed.enabled", havingValue = "true")
class DataSeeder implements ApplicationRunner {

    private final ManageDealerUseCase dealers;
    private final ManageVehicleUseCase vehicles;

    @Override
    public void run(ApplicationArguments args) {
        if (!dealers.findAll().isEmpty()) {
            log.info("Seed ignorado: a base ja possui concessionarias cadastradas");
            return;
        }

        log.info("Executando carga inicial de dados");

        UUID betim = dealer("Stellantis Betim Veículos", "11223344000186",
                "32669900", "Avenida Contorno", "3455", "Distrito Industrial Paulo Camilo Sul", "Betim", "MG");
        UUID goiana = dealer("Goiana Motors Comércio de Veículos", "22334455000186",
                "55900000", "Rodovia PE-090", "s/n", "Distrito Industrial", "Goiana", "PE");
        UUID paulista = dealer("Comercial Automotiva Paulista", "33445566000186",
                "01310100", "Avenida Paulista", "1578", "Bela Vista", "São Paulo", "SP");
        UUID rio = dealer("Rio Motors Concessionária", "44556677000186",
                "20040020", "Praça Pio X", "119", "Centro", "Rio de Janeiro", "RJ");
        UUID campina = dealer("Nordeste Automóveis Campina Grande", "55667788000186",
                "58400565", "Rua Dom Pedro II", "220", "Prata", "Campina Grande", "PB");

        vehicle("Fiat", "Pulse Drive 1.3", FuelType.FLEX, "Vermelho Montecarlo",
                2025, "9BD11223344000001", "109990.00", "Preto Vulcano", betim);
        vehicle("Fiat", "Argo Trekking", FuelType.FLEX, "Branco Banchisa",
                2024, "9BD11223344000002", "94990.00", null, betim);
        vehicle("Fiat", "Toro Freedom", FuelType.DIESEL, "Cinza Silverstone",
                2025, "9BD11223344000003", "189900.00", "Prata Bari", betim);
        vehicle("Fiat", "Mobi Like", FuelType.GASOLINA, "Branco Banchisa",
                2023, "9BD11223344000004", "74900.00", null, betim);

        vehicle("Jeep", "Compass Longitude", FuelType.DIESEL, "Preto Carbon",
                2025, "9BD22334455000001", "219900.00", null, goiana);
        vehicle("Jeep", "Renegade Sport", FuelType.FLEX, "Verde Recon",
                2024, "9BD22334455000002", "139900.00", "Preto Carbon", goiana);
        vehicle("Jeep", "Commander Overland", FuelType.DIESEL, "Branco Polar",
                2026, "9BD22334455000003", "289900.00", null, goiana);

        vehicle("Peugeot", "e-208 GT", FuelType.ELETRICO, "Azul Vertigo",
                2026, "9BD33445566000001", "259900.00", null, paulista);
        vehicle("Citroen", "C3 Aircross Feel", FuelType.FLEX, "Cinza Artense",
                2025, "9BD33445566000002", "119900.00", "Preto Perla", paulista);
        vehicle("Peugeot", "2008 Allure", FuelType.FLEX, "Branco Nacre",
                2024, "9BD33445566000003", "149900.00", null, paulista);

        vehicle("RAM", "Rampage Rebel", FuelType.DIESEL, "Preto Grafite",
                2025, "9BD44556677000001", "349900.00", null, rio);
        vehicle("Jeep", "Renegade Willys", FuelType.ETANOL, "Verde Militar",
                2024, "9BD44556677000002", "144900.00", null, rio);

        vehicle("Fiat", "Fastback Impetus", FuelType.HIBRIDO, "Cinza Strato",
                2026, "9BD55667788000001", "179900.00", "Preto Vulcano", campina);
        vehicle("Fiat", "Cronos Precision", FuelType.FLEX, "Prata Bari",
                2023, "9BD55667788000002", "99900.00", null, campina);

        vehicle("Citroen", "Basalt Shine", FuelType.FLEX, "Vermelho Elixir",
                2026, "9BD99887766000001", "129900.00", null, null);
        vehicle("Peugeot", "Partner Rapid", FuelType.DIESEL, "Branco Banquise",
                null, null, null, null, null);

        log.info("Carga inicial concluida: {} concessionarias e {} veiculos",
                dealers.findAll().size(), vehicles.findAll().size());
    }

    private UUID dealer(String corporateName, String cnpj, String cep, String street, String number,
            String neighborhood, String city, String state) {

        return dealers.create(corporateName, new Cnpj(cnpj), Address.builder()
                .cep(new Cep(cep))
                .street(street)
                .number(number)
                .neighborhood(neighborhood)
                .city(city)
                .state(state)
                .build())
                .getId();
    }

    private void vehicle(String brand, String model, FuelType fuelType, String color, Integer year,
            String chassis, String price, String externalColor, UUID dealerId) {

        vehicles.create(VehicleSpec.builder()
                .brand(brand)
                .model(model)
                .fuelType(fuelType)
                .color(color)
                .year(year)
                .chassis(chassis)
                .price(price == null ? null : new BigDecimal(price))
                .externalColor(externalColor)
                .build(), dealerId);
    }
}
