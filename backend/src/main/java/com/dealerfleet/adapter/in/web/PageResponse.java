package com.dealerfleet.adapter.in.web;

import java.util.List;
import java.util.function.Function;

import com.dealerfleet.application.port.PageResult;

public record PageResponse<T>(List<T> content, int page, int size, long totalElements, int totalPages) {

    public static <S, T> PageResponse<T> from(PageResult<S> result, Function<? super S, ? extends T> mapper) {
        PageResult<T> mapped = result.map(mapper);

        return new PageResponse<>(
                mapped.content(),
                mapped.page(),
                mapped.size(),
                mapped.totalElements(),
                mapped.totalPages());
    }
}
