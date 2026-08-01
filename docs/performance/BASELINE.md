# Ingress Gateway Performance Baseline

**Record Date:** 2026-07-30 21:57:55 UTC  
**Target Ingress:** Traefik v3.1.7  
**Status:** Validated  

This baseline acts as a reference for future performance regressions.

## Summary Metrics

| Metric | Target Value | Status |
| :--- | :--- | :--- |
| **Startup Duration** | 2.084 s | ✅ Normal |
| **Configuration Reload** | 0.009 s | ✅ Instant |
| **Ping Health Latency** | 2 ms | ✅ Excellent |
| **Metrics Telemetry Latency** | 2 ms | ✅ Excellent |
| **Dashboard Latency** | 11 ms | ✅ Excellent |
| **Routing Latency** | 10 ms | ✅ Excellent |

## Detailed Breakdown
- **Startup Duration**: Measured from 'docker restart sj-traefik' until the ping entrypoint returns 'HTTP 200'.
- **Configuration Reload**: Dynamic config directory watcher reload latency.
- **Latencies**: Measured over 10 consecutive requests via standard TLS SNI resolution headers.
