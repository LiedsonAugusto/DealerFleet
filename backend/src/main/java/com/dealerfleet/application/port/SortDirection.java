package com.dealerfleet.application.port;

public enum SortDirection {

    ASC,
    DESC;

    public static SortDirection from(String value) {
        return "desc".equalsIgnoreCase(value) ? DESC : ASC;
    }
}
