package com.dealerfleet.adapter.out.persistence.dealer;

import java.util.UUID;

import org.springframework.data.domain.Persistable;

import jakarta.persistence.Column;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PostLoad;
import jakarta.persistence.PostPersist;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import jakarta.persistence.UniqueConstraint;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "dealer", uniqueConstraints = @UniqueConstraint(name = "uk_dealer_cnpj", columnNames = "cnpj"))
class DealerJpaEntity implements Persistable<UUID> {

    @Id
    @Column(name = "id", nullable = false)
    private UUID id;

    @Column(name = "corporate_name", nullable = false, length = 150)
    private String corporateName;

    @Column(name = "cnpj", nullable = false, length = 14)
    private String cnpj;

    @Embedded
    private AddressEmbeddable address;

    @Transient
    private boolean newEntity = true;

    @Override
    public boolean isNew() {
        return newEntity;
    }

    @PostLoad
    @PostPersist
    void markAsPersisted() {
        this.newEntity = false;
    }
}
