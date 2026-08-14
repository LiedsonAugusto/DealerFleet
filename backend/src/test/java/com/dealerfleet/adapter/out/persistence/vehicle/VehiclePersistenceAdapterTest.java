package com.dealerfleet.adapter.out.persistence.vehicle;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.math.BigDecimal;
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
}
