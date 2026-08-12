package com.dealerfleet.domain.exception;

import java.util.UUID;

public class NotFoundException extends DomainException {

    public NotFoundException(String message) {
        super(message);
    }

    public static NotFoundException vehicle(UUID id) {
        return new NotFoundException("Veiculo nao encontrado: " + id);
    }

    public static NotFoundException dealer(UUID id) {
        return new NotFoundException("Concessionaria nao encontrada: " + id);
    }
}
