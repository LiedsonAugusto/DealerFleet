package com.dealerfleet.adapter.out.persistence.vehicle;

import java.math.BigDecimal;
import java.util.UUID;

import org.springframework.data.domain.Persistable;

import com.dealerfleet.domain.vehicle.FuelType;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
@Table(name = "vehicle", uniqueConstraints = @UniqueConstraint(name = "uk_vehicle_chassis", columnNames = "chassis"))
class VehicleJpaEntity implements Persistable<UUID> {

    @Id
    @Column(name = "id", nullable = false)
    private UUID id;

    @Column(name = "brand", nullable = false, length = 60)
    private String brand;

    @Column(name = "model", nullable = false, length = 60)
    private String model;

    @Enumerated(EnumType.STRING)
    @Column(name = "fuel_type", nullable = false, length = 20)
    private FuelType fuelType;

    @Column(name = "color", nullable = false, length = 40)
    private String color;

    @Column(name = "model_year")
    private Integer year;

    @Column(name = "chassis", length = 17)
    private String chassis;

    @Column(name = "price", precision = 12, scale = 2)
    private BigDecimal price;

    @Column(name = "external_color", length = 40)
    private String externalColor;

    @Column(name = "dealer_id")
    private UUID dealerId;

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
