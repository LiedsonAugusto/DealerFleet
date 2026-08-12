package com.dealerfleet.adapter.in.web;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import com.dealerfleet.application.exception.ExternalServiceException;
import com.dealerfleet.domain.exception.BusinessRuleException;
import com.dealerfleet.domain.exception.InvalidValueException;
import com.dealerfleet.domain.exception.NotFoundException;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestControllerAdvice
class ApiExceptionHandler {

    @ExceptionHandler(NotFoundException.class)
    ProblemDetail handleNotFound(NotFoundException exception) {
        return problem(HttpStatus.NOT_FOUND, "Registro nao encontrado", exception.getMessage());
    }

    @ExceptionHandler(BusinessRuleException.class)
    ProblemDetail handleBusinessRule(BusinessRuleException exception) {
        return problem(HttpStatus.CONFLICT, "Regra de negocio violada", exception.getMessage());
    }

    @ExceptionHandler(InvalidValueException.class)
    ProblemDetail handleInvalidValue(InvalidValueException exception) {
        return problem(HttpStatus.BAD_REQUEST, "Dados invalidos", exception.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ProblemDetail handleValidation(MethodArgumentNotValidException exception) {
        Map<String, String> errors = new LinkedHashMap<>();
        exception.getBindingResult().getFieldErrors()
                .forEach(error -> errors.putIfAbsent(error.getField(), error.getDefaultMessage()));

        ProblemDetail problem = problem(HttpStatus.BAD_REQUEST, "Dados invalidos",
                "Um ou mais campos nao passaram na validacao");
        problem.setProperty("errors", errors);
        return problem;
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    ProblemDetail handleUnreadableBody(HttpMessageNotReadableException exception) {
        log.warn("Corpo da requisicao ilegivel: {}", exception.getMessage());
        return problem(HttpStatus.BAD_REQUEST, "Requisicao malformada",
                "Nao foi possivel interpretar o corpo da requisicao");
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    ProblemDetail handleTypeMismatch(MethodArgumentTypeMismatchException exception) {
        return problem(HttpStatus.BAD_REQUEST, "Parametro invalido",
                "Valor invalido para o parametro '%s'".formatted(exception.getName()));
    }

    @ExceptionHandler(ExternalServiceException.class)
    ProblemDetail handleExternalService(ExternalServiceException exception) {
        return problem(HttpStatus.SERVICE_UNAVAILABLE, "Servico externo indisponivel", exception.getMessage());
    }

    @ExceptionHandler(Exception.class)
    ProblemDetail handleUnexpected(Exception exception) {
        log.error("Erro nao tratado", exception);
        return problem(HttpStatus.INTERNAL_SERVER_ERROR, "Erro interno",
                "Ocorreu um erro inesperado ao processar a requisicao");
    }

    private ProblemDetail problem(HttpStatus status, String title, String detail) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(status, detail);
        problem.setTitle(title);
        return problem;
    }
}
