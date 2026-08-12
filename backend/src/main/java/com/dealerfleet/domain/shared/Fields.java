package com.dealerfleet.domain.shared;

import com.dealerfleet.domain.exception.InvalidValueException;

import lombok.AccessLevel;
import lombok.NoArgsConstructor;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public final class Fields {

    public static String required(String value, String name) {
        if (value == null || value.isBlank()) {
            throw new InvalidValueException(name + " e obrigatorio");
        }
        return value.trim();
    }

    public static <T> T requiredValue(T value, String name) {
        if (value == null) {
            throw new InvalidValueException(name + " e obrigatorio");
        }
        return value;
    }

    public static String optional(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
