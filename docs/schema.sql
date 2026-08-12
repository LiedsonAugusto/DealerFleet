CREATE TABLE dealer (
    id             UUID         NOT NULL,
    corporate_name VARCHAR(150) NOT NULL,
    cnpj           VARCHAR(14)  NOT NULL,
    cep            VARCHAR(8)   NOT NULL,
    street         VARCHAR(150) NOT NULL,
    number         VARCHAR(20),
    complement     VARCHAR(100),
    neighborhood   VARCHAR(100) NOT NULL,
    city           VARCHAR(100) NOT NULL,
    state          VARCHAR(2)   NOT NULL,
    CONSTRAINT pk_dealer PRIMARY KEY (id),
    CONSTRAINT uk_dealer_cnpj UNIQUE (cnpj)
);

CREATE TABLE vehicle (
    id             UUID          NOT NULL,
    brand          VARCHAR(60)   NOT NULL,
    model          VARCHAR(60)   NOT NULL,
    fuel_type      VARCHAR(20)   NOT NULL,
    color          VARCHAR(40)   NOT NULL,
    model_year     INTEGER,
    chassis        VARCHAR(17),
    price          NUMERIC(12, 2),
    external_color VARCHAR(40),
    dealer_id      UUID,
    CONSTRAINT pk_vehicle PRIMARY KEY (id),
    CONSTRAINT uk_vehicle_chassis UNIQUE (chassis),
    CONSTRAINT fk_vehicle_dealer FOREIGN KEY (dealer_id) REFERENCES dealer (id)
);

CREATE INDEX idx_vehicle_dealer ON vehicle (dealer_id);
