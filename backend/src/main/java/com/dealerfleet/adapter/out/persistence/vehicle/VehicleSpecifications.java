package com.dealerfleet.adapter.out.persistence.vehicle;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

import org.hibernate.query.criteria.HibernateCriteriaBuilder;
import org.hibernate.query.criteria.JpaExpression;
import org.springframework.data.jpa.domain.Specification;

import com.dealerfleet.application.port.VehicleQuery;
import com.dealerfleet.domain.vehicle.FuelType;

import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Predicate;

final class VehicleSpecifications {

    private VehicleSpecifications() {
    }

    static Specification<VehicleJpaEntity> from(VehicleQuery query) {
        List<Specification<VehicleJpaEntity>> filters = new ArrayList<>();

        if (query.search() != null) {
            filters.add(search(query.search()));
        }
        if (query.brand() != null) {
            filters.add(contains("brand", query.brand()));
        }
        if (query.model() != null) {
            filters.add(contains("model", query.model()));
        }
        if (query.color() != null) {
            filters.add(contains("color", query.color()));
        }
        if (query.year() != null) {
            filters.add(yearContains(query.year()));
        }
        if (query.fuelType() != null) {
            filters.add(fuelType(query.fuelType()));
        }
        if (query.unassigned()) {
            filters.add(unassigned());
        } else if (query.dealerId() != null) {
            filters.add(dealer(query.dealerId()));
        }

        return filters.isEmpty() ? Specification.unrestricted() : Specification.allOf(filters);
    }

    private static Specification<VehicleJpaEntity> search(String value) {
        String pattern = pattern(value);

        return (root, query, builder) -> builder.or(
                like(builder, root.get("brand"), pattern),
                like(builder, root.get("model"), pattern),
                like(builder, root.get("color"), pattern),
                like(builder, root.get("chassis"), pattern));
    }

    private static Specification<VehicleJpaEntity> contains(String field, String value) {
        String pattern = pattern(value);

        return (root, query, builder) -> like(builder, root.get(field), pattern);
    }

    private static Specification<VehicleJpaEntity> yearContains(String value) {
        String pattern = pattern(value);

        return (root, query, builder) -> {
            JpaExpression<?> year = (JpaExpression<?>) root.<Integer>get("year");

            return builder.like(((HibernateCriteriaBuilder) builder).cast(year, String.class), pattern);
        };
    }

    private static Specification<VehicleJpaEntity> fuelType(FuelType fuelType) {
        return (root, query, builder) -> builder.equal(root.get("fuelType"), fuelType);
    }

    private static Specification<VehicleJpaEntity> dealer(UUID dealerId) {
        return (root, query, builder) -> builder.equal(root.get("dealerId"), dealerId);
    }

    private static Specification<VehicleJpaEntity> unassigned() {
        return (root, query, builder) -> builder.isNull(root.get("dealerId"));
    }

    private static Predicate like(CriteriaBuilder builder, Expression<String> field, String pattern) {
        return builder.like(builder.lower(field), pattern);
    }

    private static String pattern(String value) {
        return "%" + value.toLowerCase(Locale.ROOT) + "%";
    }
}
