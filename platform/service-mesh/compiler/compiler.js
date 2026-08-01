const fs = require('fs');
const path = require('path');
const CompilerContext = require('./compiler-context');
const CompilerValidator = require('./compiler-validator');
const PolicyResolver = require('./policy-resolver');
const IdentityResolver = require('./identity-resolver');
const DependencyResolver = require('./dependency-resolver');
const SnapshotBuilder = require('./snapshot-builder');
const CompileReport = require('./compile-report');
const { globalEventDispatcher } = require('../events');
const { globalMetrics } = require('../observability/metrics');

class SnapshotCompiler {
  constructor(loader, outputPath) {
    this.loader = loader;
    this.outputPath = outputPath;
    this.validator = new CompilerValidator();
  }

  async compile() {
    const context = new CompilerContext();
    try {
      const loaded = await this.loader.load();
      for (const item of loaded) {
        context.addConfig(item.id, item.config, item.filePath);
      }

      const services = {};
      
      // 1. Schema & Validation & Resolving phase
      for (const [id, item] of context.configs.entries()) {
        try {
          // Schema Validation
          this.validator.validate(item.config);

          const spec = item.config.spec;

          // Identity Resolution
          const identity = IdentityResolver.resolve(spec);

          // Policy Resolution
          const resolvedPolicies = PolicyResolver.resolve(spec);

          // Compile into compiled service representation
          const compiledService = {
            ...spec,
            identity,
            policies: resolvedPolicies,
            spec
          };

          services[id] = compiledService;
          context.addCompiledService(id, compiledService);
        } catch (err) {
          context.addError(err);
        }
      }

      // 2. Dependency Resolution phase
      if (!context.hasErrors()) {
        try {
          DependencyResolver.resolve(services, context);
        } catch (err) {
          context.addError(err);
        }
      }

      // 3. Check for failures
      if (context.hasErrors()) {
        globalMetrics.recordRegistryReload(false);
        const report = CompileReport.generate(context);
        return {
          success: false,
          servicesCount: 0,
          errors: report.errors.map(e => e.message),
          report
        };
      }

      // Determine build number and version
      let buildNumber = 1;
      let version = '1.0.0';
      if (fs.existsSync(this.outputPath)) {
        try {
          const prev = JSON.parse(fs.readFileSync(this.outputPath, 'utf8'));
          buildNumber = (prev.buildNumber || 0) + 1;
          version = prev.version || '1.0.0';
        } catch (_) {}
      }

      // 4. Build Immutable Snapshot
      const snapshot = SnapshotBuilder.build(services, context.dependencyGraph, version, buildNumber);

      // Write snapshot to output path
      const dir = path.dirname(this.outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.outputPath, JSON.stringify(snapshot, null, 2), 'utf8');

      // Generate and write runtime manifest
      const manifestPath = path.join(dir, 'manifest.json');
      const manifest = {
        platformName: "SJ Cloud",
        platformVersion: "1.0.0",
        runtimeVersion: "1.0.0",
        buildNumber: snapshot.buildNumber,
        snapshotVersion: snapshot.version,
        snapshotChecksum: snapshot.sha256,
        compileTimestamp: snapshot.compiledAt,
        runtimeState: "READY",
        enabledFeatures: ["service-mesh", "api-gateway", "runtime-governance", "plugin-framework"],
        serviceCount: Object.keys(services).length,
        pluginCount: 0,
        routingEngine: "sj-mesh-routing-engine",
        policyVersion: "v1alpha1",
        observabilityVersion: "1.0.0",
        supportedApiVersions: ["mesh.sjcloud.io/v1alpha1"],
        supportedMeshVersion: "1.0.0",
        environment: process.env.NODE_ENV || 'development',
        gitCommit: snapshot.gitCommit,
        architectureVersion: "1.0.0",
        kubernetesCompatibility: true
      };
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');

      // Record snapshot to history backup log
      try {
        const SnapshotHistory = require('../cache/snapshot-history');
        const history = new SnapshotHistory(path.join(path.dirname(this.outputPath), '../../history'));
        history.addEntry(snapshot);
      } catch (err) {
        console.error('Failed to add snapshot to history:', err.message);
      }

      // Record observability metrics & trigger events
      const durationMs = context.getDurationMs();
      globalMetrics.recordSnapshotCompileDuration(durationMs);
      globalMetrics.recordRegistryReload(true);
      globalMetrics.setSnapshotInfo(buildNumber, Date.now());
      globalMetrics.setActiveServicesCount(Object.keys(services).length);

      globalEventDispatcher.dispatchSnapshotCompiled(snapshot);

      const report = CompileReport.generate(context, snapshot);
      return {
        success: true,
        servicesCount: Object.keys(services).length,
        errors: [],
        snapshot,
        report
      };
    } catch (err) {
      globalMetrics.recordRegistryReload(false);
      context.addError(err);
      const report = CompileReport.generate(context);
      return {
        success: false,
        servicesCount: 0,
        errors: [err.message],
        report
      };
    }
  }
}

module.exports = {
  SnapshotCompiler
};
