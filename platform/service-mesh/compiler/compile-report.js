class CompileReport {
  static generate(context, snapshot = null) {
    return {
      success: !context.hasErrors(),
      buildNumber: snapshot ? snapshot.buildNumber : null,
      version: snapshot ? snapshot.version : null,
      sha256: snapshot ? snapshot.sha256 : null,
      compiledAt: snapshot ? snapshot.compiledAt : null,
      durationMs: context.getDurationMs(),
      servicesCount: snapshot ? Object.keys(snapshot.services).length : 0,
      warnings: context.warnings,
      errors: context.errors.map(err => ({
        message: err.message,
        code: err.error_code || 'UNKNOWN',
        details: err.details
      }))
    };
  }
}

module.exports = CompileReport;
