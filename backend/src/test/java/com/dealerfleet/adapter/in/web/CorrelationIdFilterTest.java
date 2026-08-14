package com.dealerfleet.adapter.in.web;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.concurrent.atomic.AtomicReference;

import jakarta.servlet.FilterChain;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.slf4j.MDC;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

class CorrelationIdFilterTest {

    private static final String HEADER = "X-Request-Id";
    private static final String MDC_KEY = "requestId";

    private final CorrelationIdFilter filter = new CorrelationIdFilter();

    private static MockHttpServletRequest requestWith(String incoming) {
        MockHttpServletRequest request = new MockHttpServletRequest();
        if (incoming != null) {
            request.addHeader(HEADER, incoming);
        }
        return request;
    }

    private String responseIdFor(String incoming) throws Exception {
        MockHttpServletResponse response = new MockHttpServletResponse();
        filter.doFilter(requestWith(incoming), response, new MockFilterChain());
        return response.getHeader(HEADER);
    }

    @Test
    @DisplayName("reaproveita o identificador enviado pelo cliente")
    void reusesIncomingRequestId() throws Exception {
        assertThat(responseIdFor("f47ac10b")).isEqualTo("f47ac10b");
    }

    @ParameterizedTest
    @NullSource
    @ValueSource(strings = {"", "   "})
    @DisplayName("gera um identificador quando o cliente nao envia um utilizavel")
    void generatesRequestIdWhenAbsent(String incoming) throws Exception {
        assertThat(responseIdFor(incoming)).isNotBlank();
    }

    @Test
    @DisplayName("cada requisicao sem identificador recebe um valor distinto")
    void generatesDistinctRequestIds() throws Exception {
        assertThat(responseIdFor(null)).isNotEqualTo(responseIdFor(null));
    }

    @Test
    @DisplayName("o identificador fica no MDC durante a requisicao e sai ao final")
    void publishesRequestIdToMdcAndCleansUp() throws Exception {
        AtomicReference<String> duringRequest = new AtomicReference<>();
        FilterChain chain = (request, response) -> duringRequest.set(MDC.get(MDC_KEY));

        filter.doFilter(requestWith("f47ac10b"), new MockHttpServletResponse(), chain);

        assertThat(duringRequest.get()).isEqualTo("f47ac10b");
        assertThat(MDC.get(MDC_KEY)).isNull();
    }

    @Test
    @DisplayName("o MDC e limpo mesmo quando a requisicao falha")
    void cleansUpMdcWhenRequestFails() {
        FilterChain failing = (request, response) -> {
            throw new IllegalStateException("falha no processamento");
        };

        assertThatThrownBy(() -> filter.doFilter(requestWith(null), new MockHttpServletResponse(), failing))
                .isInstanceOf(IllegalStateException.class);

        assertThat(MDC.get(MDC_KEY)).isNull();
    }
}
