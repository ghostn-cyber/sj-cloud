# Platform Secrets Storage

This directory holds environment configurations, JWT private keys, and API secrets for local development.

## Git Security
All sensitive keys and credential assets generated during bootstrap are stored in Git-ignored files inside this directory.

## Generation
Secrets are initialized automatically on boot by running:
```bash
make doctor
```
or directly running the bootstrap engine.
