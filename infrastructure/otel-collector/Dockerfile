FROM otel/opentelemetry-collector-contrib:0.104.0 AS otel

FROM alpine:3.20
RUN apk add --no-cache curl ca-certificates
COPY --from=otel /otelcol-contrib /otelcol-contrib
USER 1000:1000
ENTRYPOINT ["/otelcol-contrib"]
