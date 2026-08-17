package com.dealerfleet.adapter.out.persistence.vehicle;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.hibernate.exception.ConstraintViolationException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase.Replace;
import org.springframework.boot.jpa.test.autoconfigure.TestEntityManager;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import com.dealerfleet.adapter.out.persistence.ProductionSchema;
import com.dealerfleet.application.port.PageQuery;
import com.dealerfleet.application.port.PageResult;
import com.dealerfleet.application.port.VehicleQuery;
import com.dealerfleet.application.port.VehicleSummary;
import com.dealerfleet.domain.vehicle.FuelType;
import com.dealerfleet.domain.vehicle.Vehicle;
import com.dealerfleet.domain.vehicle.VehicleSpec;

@DataJpaTest(properties = {
        "spring.jpa.hibernate.ddl-auto=validate",
        "spring.sql.init.mode=always",
        "spring.datasource.url=jdbc:h2:mem:vehicle-schema;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE"
})
@AutoConfigureTestDatabase(replace = Replace.NONE)
@Import({VehiclePersistenceAdapter.class, VehicleMapper.class})
class VehiclePersistenceAdapterTest {

    private static final String CHASSIS = "9BWZZZ377VT004251";

    @Autowired
    private VehiclePersistenceAdapter adapter;

    @Autowired
    private TestEntityManager entityManager;

    private UUID betim;
    private UUID goiana;

    @DynamicPropertySource
    static void productionSchema(DynamicPropertyRegistry registry) {
        registry.add("spring.sql.init.schema-locations", ProductionSchema::location);
    }

    @BeforeEach
    void seedDealers() {
        betim = insertDealer("11223344000186", "Stellantis Betim Veiculos");
        goiana = insertDealer("22334455000186", "Goiana Motors");
    }

    private UUID insertDealer(String cnpj, String corporateName) {
        UUID id = UUID.randomUUID();
        entityManager.getEntityManager()
                .createNativeQuery("""
                        INSERT INTO dealer (id, corporate_name, cnpj, cep, street, neighborhood, city, state)
                        VALUES (?, ?, ?, '32669900', 'Avenida Contorno', 'Centro', 'Betim', 'MG')
                        """)
                .setParameter(1, id)
                .setParameter(2, corporateName)
                .setParameter(3, cnpj)
                .executeUpdate();
        return id;
    }

    private static VehicleSpec.VehicleSpecBuilder specBuilder() {
        return VehicleSpec.builder()
                .brand("Fiat")
                .model("Argo")
                .fuelType(FuelType.FLEX)
                .color("Prata");
    }

    private Vehicle reload(UUID id) {
        entityManager.flush();
        entityManager.clear();
        return adapter.findById(id).orElseThrow();
    }

    @Test
    @DisplayName("grava e reconstroi o veiculo com todos os campos opcionais preenchidos")
    void savesAndRebuildsCompleteVehicle() {
        Vehicle saved = adapter.save(Vehicle.create(specBuilder()
                .year(2025)
                .chassis(CHASSIS)
                .price(new BigDecimal("94990.00"))
                .externalColor("Preto Vulcano")
                .build(), betim));

        Vehicle found = reload(saved.getId());

        assertThat(found.getBrand()).isEqualTo("Fiat");
        assertThat(found.getModel()).isEqualTo("Argo");
        assertThat(found.getFuelType()).isEqualTo(FuelType.FLEX);
        assertThat(found.getColor()).isEqualTo("Prata");
        assertThat(found.getYear()).isEqualTo(2025);
        assertThat(found.getChassis()).isEqualTo(CHASSIS);
        assertThat(found.getPrice()).isEqualByComparingTo("94990.00");
        assertThat(found.getExternalColor()).isEqualTo("Preto Vulcano");
        assertThat(found.getDealerId()).isEqualTo(betim);
    }

    @Test
    @DisplayName("veiculo sem concessionaria e sem opcionais vai e volta com nulos")
    void savesUnassignedVehicle() {
        Vehicle saved = adapter.save(Vehicle.create(specBuilder().build(), null));

        Vehicle found = reload(saved.getId());

        assertThat(found.getDealerId()).isNull();
        assertThat(found.getYear()).isNull();
        assertThat(found.getChassis()).isNull();
        assertThat(found.getPrice()).isNull();
        assertThat(found.getExternalColor()).isNull();
    }

    @Test
    @DisplayName("atualizacao altera o registro existente em vez de inserir outro")
    void updatesInPlace() {
        Vehicle saved = adapter.save(Vehicle.create(specBuilder().year(2024).build(), betim));
        UUID id = saved.getId();

        Vehicle managed = reload(id);
        managed.update(specBuilder().brand("Jeep").model("Renegade").fuelType(FuelType.DIESEL).year(2025).build());
        adapter.save(managed);

        Vehicle found = reload(id);

        assertThat(adapter.findAll()).hasSize(1);
        assertThat(found.getBrand()).isEqualTo("Jeep");
        assertThat(found.getModel()).isEqualTo("Renegade");
        assertThat(found.getFuelType()).isEqualTo(FuelType.DIESEL);
        assertThat(found.getYear()).isEqualTo(2025);
    }

    @Test
    @DisplayName("troca de concessionaria persiste o novo vinculo")
    void persistsDealerChange() {
        Vehicle saved = adapter.save(Vehicle.create(specBuilder().build(), betim));
        UUID id = saved.getId();

        Vehicle managed = reload(id);
        managed.assignTo(goiana);
        adapter.save(managed);

        assertThat(reload(id).getDealerId()).isEqualTo(goiana);
    }

    @Test
    @DisplayName("desvinculo persiste a concessionaria como nula")
    void persistsUnassign() {
        Vehicle saved = adapter.save(Vehicle.create(specBuilder().build(), betim));
        UUID id = saved.getId();

        Vehicle managed = reload(id);
        managed.unassign();
        adapter.save(managed);

        assertThat(reload(id).getDealerId()).isNull();
    }

    @Test
    @DisplayName("findByDealerId e countByDealerId consideram apenas o vinculo informado")
    void filtersByDealer() {
        adapter.save(Vehicle.create(specBuilder().build(), betim));
        adapter.save(Vehicle.create(specBuilder().model("Pulse").build(), betim));
        adapter.save(Vehicle.create(specBuilder().model("Toro").build(), goiana));
        adapter.save(Vehicle.create(specBuilder().model("Mobi").build(), null));
        entityManager.flush();
        entityManager.clear();

        assertThat(adapter.findByDealerId(betim)).hasSize(2);
        assertThat(adapter.countByDealerId(betim)).isEqualTo(2);
        assertThat(adapter.countByDealerId(goiana)).isEqualTo(1);
    }

    @Test
    @DisplayName("findByChassis localiza pela chave alternativa")
    void findsByChassis() {
        adapter.save(Vehicle.create(specBuilder().chassis(CHASSIS).build(), null));
        entityManager.flush();
        entityManager.clear();

        assertThat(adapter.findByChassis(CHASSIS)).isPresent();
        assertThat(adapter.findByChassis("9BWZZZ377VT004999")).isEmpty();
    }

    @Test
    @DisplayName("o banco recusa dois veiculos com o mesmo chassi")
    void rejectsDuplicatedChassisAtDatabaseLevel() {
        adapter.save(Vehicle.create(specBuilder().chassis(CHASSIS).build(), null));
        adapter.save(Vehicle.create(specBuilder().chassis(CHASSIS).build(), null));

        assertThatThrownBy(() -> entityManager.flush())
                .isInstanceOf(ConstraintViolationException.class)
                .hasMessageContaining("uk_vehicle_chassis");
    }

    @Test
    @DisplayName("o banco recusa vinculo com concessionaria inexistente")
    void rejectsUnknownDealerAtDatabaseLevel() {
        adapter.save(Vehicle.create(specBuilder().build(), UUID.randomUUID()));

        assertThatThrownBy(() -> entityManager.flush())
                .isInstanceOf(ConstraintViolationException.class)
                .hasMessageContaining("fk_vehicle_dealer");
    }

    @Test
    @DisplayName("deleteById remove o registro")
    void deletesVehicle() {
        Vehicle saved = adapter.save(Vehicle.create(specBuilder().build(), betim));
        entityManager.flush();

        adapter.deleteById(saved.getId());
        entityManager.flush();
        entityManager.clear();

        assertThat(adapter.findById(saved.getId())).isEmpty();
    }

    private void seedFleet() {
        adapter.save(Vehicle.create(specBuilder().brand("Fiat").model("Pulse").year(2025)
                .price(new BigDecimal("109990.00")).build(), betim));
        adapter.save(Vehicle.create(specBuilder().brand("Jeep").model("Compass").color("Preto")
                .fuelType(FuelType.DIESEL).year(2024).price(new BigDecimal("219900.00")).build(), goiana));
        adapter.save(Vehicle.create(specBuilder().brand("RAM").model("Rampage").color("Branco")
                .year(2023).price(new BigDecimal("349900.00")).build(), null));
        adapter.save(Vehicle.create(specBuilder().brand("citroen").model("Basalt").year(2025).build(), betim));

        entityManager.flush();
        entityManager.clear();
    }

    private static VehicleQuery filterBy(String field, String value) {
        return switch (field) {
            case "search" -> new VehicleQuery(value, null, null, null, null, null, null, false);
            case "brand" -> new VehicleQuery(null, value, null, null, null, null, null, false);
            case "model" -> new VehicleQuery(null, null, value, null, null, null, null, false);
            case "color" -> new VehicleQuery(null, null, null, value, null, null, null, false);
            case "year" -> new VehicleQuery(null, null, null, null, value, null, null, false);
            default -> VehicleQuery.none();
        };
    }

    private List<String> modelsOf(PageResult<Vehicle> result) {
        return result.content().stream().map(Vehicle::getModel).toList();
    }

    @Test
    @DisplayName("search fatia o resultado e informa o total de itens e de paginas")
    void paginatesResult() {
        seedFleet();

        PageResult<Vehicle> first = adapter.search(VehicleQuery.none(), PageQuery.of(1, 2, "model", "asc"));
        PageResult<Vehicle> second = adapter.search(VehicleQuery.none(), PageQuery.of(2, 2, "model", "asc"));

        assertThat(first.content()).hasSize(2);
        assertThat(first.totalElements()).isEqualTo(4);
        assertThat(first.totalPages()).isEqualTo(2);
        assertThat(first.page()).isEqualTo(1);

        assertThat(modelsOf(first)).containsExactly("Basalt", "Compass");
        assertThat(modelsOf(second)).containsExactly("Pulse", "Rampage");
    }

    @Test
    @DisplayName("pagina alem do fim devolve conteudo vazio mantendo o total")
    void pageBeyondLastIsEmpty() {
        seedFleet();

        PageResult<Vehicle> result = adapter.search(VehicleQuery.none(), PageQuery.of(9, 2, null, null));

        assertThat(result.content()).isEmpty();
        assertThat(result.totalElements()).isEqualTo(4);
        assertThat(result.totalPages()).isEqualTo(2);
    }

    @Test
    @DisplayName("ordenacao por texto ignora maiusculas e respeita a direcao")
    void sortsByTextIgnoringCase() {
        seedFleet();

        PageResult<Vehicle> ascending = adapter.search(VehicleQuery.none(), PageQuery.of(1, 10, "brand", "asc"));
        PageResult<Vehicle> descending = adapter.search(VehicleQuery.none(), PageQuery.of(1, 10, "brand", "desc"));

        assertThat(ascending.content().stream().map(Vehicle::getBrand))
                .containsExactly("citroen", "Fiat", "Jeep", "RAM");
        assertThat(descending.content().stream().map(Vehicle::getBrand))
                .containsExactly("RAM", "Jeep", "Fiat", "citroen");
    }

    @Test
    @DisplayName("ordenacao numerica joga os nulos para o fim nas duas direcoes")
    void sortsNumericWithNullsLast() {
        seedFleet();

        PageResult<Vehicle> ascending = adapter.search(VehicleQuery.none(), PageQuery.of(1, 10, "price", "asc"));
        PageResult<Vehicle> descending = adapter.search(VehicleQuery.none(), PageQuery.of(1, 10, "price", "desc"));

        assertThat(modelsOf(ascending)).containsExactly("Pulse", "Compass", "Rampage", "Basalt");
        assertThat(modelsOf(descending)).containsExactly("Rampage", "Compass", "Pulse", "Basalt");
    }

    @Test
    @DisplayName("campo de ordenacao desconhecido cai no criterio estavel em vez de falhar")
    void unknownSortFieldFallsBack() {
        seedFleet();

        PageResult<Vehicle> result = adapter.search(VehicleQuery.none(), PageQuery.of(1, 10, "dealer", "asc"));

        assertThat(result.content()).hasSize(4);
    }

    @Test
    @DisplayName("filtros de texto casam por trecho e ignoram maiusculas")
    void filtersTextByContains() {
        seedFleet();

        assertThat(modelsOf(adapter.search(filterBy("brand", "fia"), PageQuery.first()))).containsExactly("Pulse");
        assertThat(modelsOf(adapter.search(filterBy("brand", "CITRO"), PageQuery.first()))).containsExactly("Basalt");
        assertThat(modelsOf(adapter.search(filterBy("model", "amp"), PageQuery.first()))).containsExactly("Rampage");
        assertThat(modelsOf(adapter.search(filterBy("color", "pret"), PageQuery.first()))).containsExactly("Compass");
    }

    @Test
    @DisplayName("filtro de ano casa por trecho, como o campo de texto da tela")
    void filtersYearByContains() {
        seedFleet();

        assertThat(adapter.search(filterBy("year", "202"), PageQuery.first()).totalElements()).isEqualTo(4);
        assertThat(modelsOf(adapter.search(filterBy("year", "2023"), PageQuery.first()))).containsExactly("Rampage");
        assertThat(adapter.search(filterBy("year", "2025"), PageQuery.first()).totalElements()).isEqualTo(2);
        assertThat(adapter.search(filterBy("year", "1999"), PageQuery.first()).content()).isEmpty();
    }

    @Test
    @DisplayName("busca livre varre marca, modelo, cor e chassi")
    void searchesAcrossFields() {
        seedFleet();
        adapter.save(Vehicle.create(specBuilder().model("Toro").chassis(CHASSIS).build(), betim));
        entityManager.flush();
        entityManager.clear();

        assertThat(modelsOf(adapter.search(filterBy("search", "jeep"), PageQuery.first()))).containsExactly("Compass");
        assertThat(modelsOf(adapter.search(filterBy("search", "rampage"), PageQuery.first()))).containsExactly("Rampage");
        assertThat(modelsOf(adapter.search(filterBy("search", "branco"), PageQuery.first()))).containsExactly("Rampage");
        assertThat(modelsOf(adapter.search(filterBy("search", CHASSIS), PageQuery.first()))).containsExactly("Toro");
    }

    @Test
    @DisplayName("filtro de combustivel e de concessionaria restringem o resultado")
    void filtersByFuelTypeAndDealer() {
        seedFleet();

        VehicleQuery diesel = new VehicleQuery(null, null, null, null, null, FuelType.DIESEL, null, false);
        VehicleQuery fromBetim = new VehicleQuery(null, null, null, null, null, null, betim, false);
        VehicleQuery withoutDealer = new VehicleQuery(null, null, null, null, null, null, null, true);

        assertThat(modelsOf(adapter.search(diesel, PageQuery.first()))).containsExactly("Compass");
        assertThat(adapter.search(fromBetim, PageQuery.first()).totalElements()).isEqualTo(2);
        assertThat(modelsOf(adapter.search(withoutDealer, PageQuery.first()))).containsExactly("Rampage");
    }

    @Test
    @DisplayName("filtros combinados somam restricoes em vez de se sobrepor")
    void combinesFilters() {
        seedFleet();

        VehicleQuery query = new VehicleQuery(null, null, null, null, "2025", null, betim, false);

        assertThat(adapter.search(query, PageQuery.first()).totalElements()).isEqualTo(2);

        VehicleQuery narrowed = new VehicleQuery(null, "fiat", null, null, "2025", null, betim, false);

        assertThat(modelsOf(adapter.search(narrowed, PageQuery.first()))).containsExactly("Pulse");
    }

    @Test
    @DisplayName("summary totaliza a frota inteira e ignora precos nulos")
    void summarizesWholeFleet() {
        seedFleet();

        VehicleSummary summary = adapter.summary();

        assertThat(summary.total()).isEqualTo(4);
        assertThat(summary.fleetValue()).isEqualByComparingTo("679790.00");
        assertThat(summary.unassigned()).isEqualTo(1);
    }

    @Test
    @DisplayName("countByDealerIds agrupa o total de cada concessionaria em uma consulta")
    void countsGroupedByDealer() {
        seedFleet();

        Map<UUID, Long> counts = adapter.countByDealerIds(List.of(betim, goiana));

        assertThat(counts).containsEntry(betim, 2L).containsEntry(goiana, 1L);
    }

    @Test
    @DisplayName("countByDealerIds omite concessionaria sem veiculo em vez de devolver zero")
    void omitsDealersWithoutVehicles() {
        adapter.save(Vehicle.create(specBuilder().build(), betim));
        entityManager.flush();
        entityManager.clear();

        assertThat(adapter.countByDealerIds(List.of(betim, goiana)))
                .containsOnlyKeys(betim);
    }

    @Test
    @DisplayName("summary de base vazia devolve zeros em vez de nulo")
    void summarizesEmptyFleet() {
        VehicleSummary summary = adapter.summary();

        assertThat(summary.total()).isZero();
        assertThat(summary.fleetValue()).isEqualByComparingTo("0");
        assertThat(summary.unassigned()).isZero();
    }
}
