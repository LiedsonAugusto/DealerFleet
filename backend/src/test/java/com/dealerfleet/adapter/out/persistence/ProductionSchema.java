package com.dealerfleet.adapter.out.persistence;

import java.nio.file.Files;
import java.nio.file.Path;

public final class ProductionSchema {

    private static final Path FROM_MODULE = Path.of("..", "docs", "schema.sql");
    private static final Path FROM_REPOSITORY_ROOT = Path.of("docs", "schema.sql");

    private ProductionSchema() {
    }

    public static String location() {
        Path script = Files.exists(FROM_MODULE) ? FROM_MODULE : FROM_REPOSITORY_ROOT;
        return "file:" + script.toAbsolutePath().normalize().toString().replace('\\', '/');
    }
}
