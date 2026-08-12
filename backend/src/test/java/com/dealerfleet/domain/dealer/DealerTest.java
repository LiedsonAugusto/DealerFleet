package com.dealerfleet.domain.dealer;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.dealerfleet.domain.exception.InvalidValueException;

class DealerTest {

    private static final Cnpj CNPJ = new Cnpj("11222333000181");

    private static Address address() {
        return Address.builder()
                .cep(new Cep("58400-000"))
                .street("Rua Sao Vicente")
                .neighborhood("Centro")
                .city("Campina Grande")
                .state("PB")
                .build();
    }

    @Test
    @DisplayName("create gera identidade propria")
    void createGeneratesId() {
        Dealer dealer = Dealer.create("Concessionaria Centro LTDA", CNPJ, address());

        assertThat(dealer.getId()).isNotNull();
        assertThat(dealer.getCorporateName()).isEqualTo("Concessionaria Centro LTDA");
        assertThat(dealer.getCnpj()).isEqualTo(CNPJ);
    }

    @Test
    @DisplayName("restore preserva a identidade recebida")
    void restoreKeepsId() {
        UUID id = UUID.randomUUID();

        assertThat(Dealer.restore(id, "Concessionaria Centro LTDA", CNPJ, address()).getId())
                .isEqualTo(id);
    }

    @Test
    @DisplayName("restore exige identidade")
    void restoreRequiresId() {
        assertThatThrownBy(() -> Dealer.restore(null, "Concessionaria Centro LTDA", CNPJ, address()))
                .isInstanceOf(InvalidValueException.class)
                .hasMessage("Id e obrigatorio");
    }

    @Test
    @DisplayName("update troca os dados cadastrais")
    void updateReplacesData() {
        Dealer dealer = Dealer.create("Concessionaria Centro LTDA", CNPJ, address());
        Cnpj other = new Cnpj("12345678000195");

        dealer.update("Concessionaria Norte LTDA", other, address());

        assertThat(dealer.getCorporateName()).isEqualTo("Concessionaria Norte LTDA");
        assertThat(dealer.getCnpj()).isEqualTo(other);
    }

    @Test
    @DisplayName("rejeita razao social em branco")
    void rejectsBlankCorporateName() {
        assertThatThrownBy(() -> Dealer.create("   ", CNPJ, address()))
                .isInstanceOf(InvalidValueException.class)
                .hasMessage("Razao social e obrigatorio");
    }

    @Test
    @DisplayName("rejeita CNPJ nulo")
    void rejectsNullCnpj() {
        assertThatThrownBy(() -> Dealer.create("Concessionaria Centro LTDA", null, address()))
                .isInstanceOf(InvalidValueException.class)
                .hasMessage("CNPJ e obrigatorio");
    }

    @Test
    @DisplayName("rejeita endereco nulo")
    void rejectsNullAddress() {
        assertThatThrownBy(() -> Dealer.create("Concessionaria Centro LTDA", CNPJ, null))
                .isInstanceOf(InvalidValueException.class)
                .hasMessage("Endereco e obrigatorio");
    }

    @Test
    @DisplayName("igualdade e por identidade, nao por atributos")
    void equalsById() {
        UUID id = UUID.randomUUID();
        Dealer one = Dealer.restore(id, "Concessionaria Centro LTDA", CNPJ, address());
        Dealer same = Dealer.restore(id, "Outro Nome LTDA", CNPJ, address());
        Dealer other = Dealer.create("Concessionaria Centro LTDA", CNPJ, address());

        assertThat(one).isEqualTo(same).isNotEqualTo(other);
    }

    @Test
    @DisplayName("concessionaria e igual a si mesma e compartilha hashCode com a mesma identidade")
    void equalsItselfAndSharesHashCode() {
        UUID id = UUID.randomUUID();
        Dealer dealer = Dealer.restore(id, "Concessionaria Centro LTDA", CNPJ, address());

        assertThat(dealer).isEqualTo(dealer)
                .hasSameHashCodeAs(Dealer.restore(id, "Outro Nome LTDA", CNPJ, address()));
    }

    @Test
    @DisplayName("nunca e igual a objeto de outro tipo")
    void neverEqualsOtherType() {
        assertThat(Dealer.create("Concessionaria Centro LTDA", CNPJ, address()))
                .isNotEqualTo("Concessionaria Centro LTDA");
    }
}
