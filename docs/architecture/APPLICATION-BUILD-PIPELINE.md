# Application Build Pipeline Architecture

**Document ID:** ARC-APP-BUILD-001  
**Version:** 1.0  
**Status:** Approved  
**Classification:** Internal Architecture  

---

## 1. Introduction
The Build Engine handles compiling source code into immutable OCI-compliant artifacts.

## 2. Compilation Engines
- **Docker Builder**: Compiles applications using customized `Dockerfiles`.
- **Buildpacks Builder**: Employs CNCF Cloud Native Buildpacks to dynamically compile runtimes (Node, Python, Go) without requiring a `Dockerfile`.
- **OCI Builder**: Direct configuration to build minimal OCI-compliant container layers.

## 3. Vulnerability Verification
The build pipeline includes an image scanner that validates built OCI layers against a blacklist of compromised packages, verifying matching signatures and generating digest checksums.
