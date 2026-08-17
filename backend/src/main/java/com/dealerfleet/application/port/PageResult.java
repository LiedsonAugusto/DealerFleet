package com.dealerfleet.application.port;

import java.util.List;
import java.util.function.Function;

public record PageResult<T>(List<T> content, int page, int size, long totalElements, int totalPages) {

    public PageResult {
        content = List.copyOf(content);
    }

    public static <T> PageResult<T> of(List<T> content, PageQuery query, long totalElements) {
        int totalPages = (int) Math.ceil((double) totalElements / query.size());

        return new PageResult<>(content, query.page(), query.size(), totalElements, Math.max(1, totalPages));
    }

    public <R> PageResult<R> map(Function<? super T, ? extends R> mapper) {
        List<R> mapped = content.stream().<R>map(mapper).toList();

        return new PageResult<>(mapped, page, size, totalElements, totalPages);
    }
}
