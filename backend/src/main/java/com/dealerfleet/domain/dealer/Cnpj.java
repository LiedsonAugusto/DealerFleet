package com.dealerfleet.domain.dealer;

import com.dealerfleet.domain.exception.InvalidValueException;

public record Cnpj(String value) {

    private static final int LENGTH = 14;
    private static final int[] FIRST_CHECK_WEIGHTS = {5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2};
    private static final int[] SECOND_CHECK_WEIGHTS = {6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2};

    public Cnpj {
        if (value == null || value.isBlank()) {
            throw new InvalidValueException("CNPJ e obrigatorio");
        }
        value = value.replaceAll("\\D", "");
        validate(value);
    }

    private static void validate(String digits) {
        if (digits.length() != LENGTH) {
            throw new InvalidValueException("CNPJ deve conter 14 digitos");
        }
        if (digits.chars().distinct().count() == 1) {
            throw new InvalidValueException("CNPJ invalido");
        }
        if (checkDigitAt(digits, FIRST_CHECK_WEIGHTS) != digitAt(digits, 12)
                || checkDigitAt(digits, SECOND_CHECK_WEIGHTS) != digitAt(digits, 13)) {
            throw new InvalidValueException("CNPJ invalido");
        }
    }

    private static int checkDigitAt(String digits, int[] weights) {
        int sum = 0;
        for (int i = 0; i < weights.length; i++) {
            sum += digitAt(digits, i) * weights[i];
        }
        int remainder = sum % 11;
        return remainder < 2 ? 0 : 11 - remainder;
    }

    private static int digitAt(String digits, int index) {
        return digits.charAt(index) - '0';
    }

    public String formatted() {
        return "%s.%s.%s/%s-%s".formatted(
                value.substring(0, 2),
                value.substring(2, 5),
                value.substring(5, 8),
                value.substring(8, 12),
                value.substring(12));
    }
}
