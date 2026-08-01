# Application Releases Architecture

**Document ID:** ARC-APP-RELEASES-001  
**Version:** 1.0  
**Status:** Approved  
**Classification:** Internal Architecture  

---

## 1. Introduction
The Release Manager captures a point-in-time configuration snapshot of an application. Releases are strictly immutable.

## 2. Release Immutable Snapshot Structure
A Release contains:
- **Unique Release ID**: `rel-<timestamp>` format.
- **OCI Image Digest**: Verified SHA hash of the application image.
- **Environment variables snapshot**: Frozen state of environment variables.
- **Secrets snapshot**: Frozen state of decrypted secrets.
- **Deployment specification**: Configuration containing strategies and scaling plans.
- **Configuration SHA**: Sha256 hash verifying structural integrity.
