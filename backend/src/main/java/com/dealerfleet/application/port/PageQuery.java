package com.dealerfleet.application.port;

public record PageQuery(int page, int size, String sort, SortDirection direction) {

    public static final int DEFAULT_SIZE = 10;
    public static final int MAX_SIZE = 100;

    public PageQuery {
        page = Math.max(1, page);
        size = size < 1 ? DEFAULT_SIZE : Math.min(size, MAX_SIZE);
        sort = sort == null || sort.isBlank() ? null : sort.trim();
        direction = direction == null ? SortDirection.ASC : direction;
    }

    public static PageQuery of(Integer page, Integer size, String sort, String direction) {
        return new PageQuery(
                page == null ? 1 : page,
                size == null ? DEFAULT_SIZE : size,
                sort,
                SortDirection.from(direction));
    }

    public static PageQuery first() {
        return of(null, null, null, null);
    }

    public boolean isSorted() {
        return sort != null;
    }
}
