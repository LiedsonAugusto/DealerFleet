package com.dealerfleet.adapter.out.persistence.dealer;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase.Replace;
import org.springframework.boot.jpa.test.autoconfigure.TestEntityManager;
import org.hibernate.exception.ConstraintViolationException;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import com.dealerfleet.adapter.out.persistence.ProductionSchema;
import com.dealerfleet.domain.dealer.Address;
import com.dealerfleet.domain.dealer.Cep;
import com.dealerfleet.domain.dealer.Cnpj;
import com.dealerfleet.domain.dealer.Dealer;

@DataJpaTest(properties = {
        "spring.jpa.hibernate.ddl-auto=validate",
        "spring.sql.init.mode=always",
        "spring.datasource.url=jdbc:h2:mem:dealer-schema;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE"
})
@AutoConfigureTestDatabase(replace = Replace.NONE)
@Import({DealerPersistenceAdapter.class, DealerMapper.class})
class DealerPersistenceAdapterTest {

    private static final Cnpj CNPJ = new Cnpj("11222333000181");
    private static final Cnpj OTHER_CNPJ = new Cnpj("12345678000195");

    @Autowired
    private DealerPersistenceAdapter adapter;

    @Autowired
    private TestEntityManager entityManager;

    @DynamicPropertySource
    static void productionSchema(DynamicPropertyRegistry registry) {
        registry.add("spring.sql.init.schema-locations", ProductionSchema::location);
    }

    private static Address address() {
        return Address.builder()
                .cep(new Cep("58400-500"))
                .street("Rua Jose de Alencar")
                .number("220")
                .complement("Sala 3")
                .neighborhood("Prata")
                .city("Campina Grande")
                .state("PB")
                .build();
    }

    private static Address otherAddress() {
        return Address.builder()
                .cep(new Cep("01310-100"))
                .street("Avenida Paulista")
                .neighborhood("Bela Vista")
                .city("Sao Paulo")
                .state("SP")
                .build();
    }

    private Dealer reload(UUID id) {
        entityManager.flush();
        entityManager.clear();
        return adapter.findById(id).orElseThrow();
    }

    @Test
    @DisplayName("grava e reconstroi a concessionaria com o endereco embutido")
    void savesAndRebuildsDealer() {
        Dealer saved = adapter.save(Dealer.create("Concessionaria Centro LTDA", CNPJ, address()));

        Dealer found = reload(saved.getId());

        assertThat(found.getId()).isEqualTo(saved.getId());
        assertThat(found.getCorporateName()).isEqualTo("Concessionaria Centro LTDA");
        assertThat(found.getCnpj()).isEqualTo(CNPJ);
        assertThat(found.getAddress().cep()).isEqualTo(new Cep("58400500"));
        assertThat(found.getAddress().street()).isEqualTo("Rua Jose de Alencar");
        assertThat(found.getAddress().number()).isEqualTo("220");
        assertThat(found.getAddress().complement()).isEqualTo("Sala 3");
        assertThat(found.getAddress().neighborhood()).isEqualTo("Prata");
        assertThat(found.getAddress().city()).isEqualTo("Campina Grande");
        assertThat(found.getAddress().state()).isEqualTo("PB");
    }

    @Test
    @DisplayName("campos opcionais ausentes vao e voltam do banco como nulos")
    void keepsOptionalFieldsNull() {
        Dealer saved = adapter.save(Dealer.create("Concessionaria Norte LTDA", CNPJ, otherAddress()));

        Dealer found = reload(saved.getId());

        assertThat(found.getAddress().number()).isNull();
        assertThat(found.getAddress().complement()).isNull();
    }

    @Test
    @DisplayName("atualizacao altera o registro existente em vez de inserir outro")
    void updatesInPlace() {
        Dealer saved = adapter.save(Dealer.create("Concessionaria Centro LTDA", CNPJ, address()));
        UUID id = saved.getId();

        Dealer managed = reload(id);
        managed.update("Concessionaria Norte LTDA", OTHER_CNPJ, otherAddress());
        adapter.save(managed);

        Dealer found = reload(id);

        assertThat(adapter.findAll()).hasSize(1);
        assertThat(found.getCorporateName()).isEqualTo("Concessionaria Norte LTDA");
        assertThat(found.getCnpj()).isEqualTo(OTHER_CNPJ);
        assertThat(found.getAddress().city()).isEqualTo("Sao Paulo");
        assertThat(found.getAddress().number()).isNull();
        assertThat(found.getAddress().complement()).isNull();
    }

    @Test
    @DisplayName("findByCnpj localiza pelo documento sem mascara")
    void findsByCnpj() {
        adapter.save(Dealer.create("Concessionaria Centro LTDA", CNPJ, address()));
        entityManager.flush();
        entityManager.clear();

        assertThat(adapter.findByCnpj(CNPJ)).isPresent();
        assertThat(adapter.findByCnpj(OTHER_CNPJ)).isEmpty();
    }

    @Test
    @DisplayName("o banco recusa duas concessionarias com o mesmo CNPJ")
    void rejectsDuplicatedCnpjAtDatabaseLevel() {
        adapter.save(Dealer.create("Concessionaria Centro LTDA", CNPJ, address()));
        adapter.save(Dealer.create("Concessionaria Norte LTDA", CNPJ, otherAddress()));

        assertThatThrownBy(() -> entityManager.flush())
                .isInstanceOf(ConstraintViolationException.class)
                .hasMessageContaining("uk_dealer_cnpj");
    }

    @Test
    @DisplayName("deleteById remove o registro")
    void deletesDealer() {
        Dealer saved = adapter.save(Dealer.create("Concessionaria Centro LTDA", CNPJ, address()));
        entityManager.flush();

        adapter.deleteById(saved.getId());
        entityManager.flush();
        entityManager.clear();

        assertThat(adapter.findById(saved.getId())).isEmpty();
    }
}
