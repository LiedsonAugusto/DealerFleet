package com.dealerfleet.domain.vehicle;

import java.math.BigDecimal;
import java.time.Year;

import com.dealerfleet.domain.exception.InvalidValueException;
import com.dealerfleet.domain.shared.Fields;

import lombok.Builder;

@Builder
public record VehicleSpec(
        String brand,
        String model,
        FuelType fuelType,
        String color,
        Integer year,
        String chassis,
        BigDecimal price,
        String externalColor) {

    private static final int MIN_YEAR = 1900;
    private static final int CHASSIS_LENGTH = 17;

    public VehicleSpec {
        brand = Fields.required(brand, "Marca");
        model = Fields.required(model, "Modelo");
        fuelType = Fields.requiredValue(fuelType, "Tipo de combustivel");
        color = Fields.required(color, "Cor");
        year = validYear(year);
        chassis = validChassis(chassis);
        price = validPrice(price);
        externalColor = Fields.optional(externalColor);
    }

    private static Integer validYear(Integer value) {
        if (value == null) {
            return null;
        }
        int limit = Year.now().getValue() + 1;
        if (value < MIN_YEAR || value > limit) {
            throw new InvalidValueException("Ano deve estar entre %d e %d".formatted(MIN_YEAR, limit));
        }
        return value;
    }

    private static String validChassis(String value) {
        String normalized = Fields.optional(value);
        if (normalized == null) {
            return null;
        }
        normalized = normalized.toUpperCase();
        if (!normalized.matches("[A-Z0-9]{" + CHASSIS_LENGTH + "}")) {
            throw new InvalidValueException("Chassi deve conter %d caracteres alfanumericos".formatted(CHASSIS_LENGTH));
        }
        return normalized;
    }

    private static BigDecimal validPrice(BigDecimal value) {
        if (value == null) {
            return null;
        }
        if (value.signum() <= 0) {
            throw new InvalidValueException("Valor deve ser maior que zero");
        }
        return value;
    }
}
