class DeploymentWindow {
  constructor() {
    this.allowedHours = { start: 0, end: 24 }; // Default allows 24 hours
    this.allowedDays = [1, 2, 3, 4, 5]; // Default weekday deployments (Monday - Friday)
  }

  setWindow(startHour, endHour, days) {
    this.allowedHours = { start: startHour, end: endHour };
    this.allowedDays = days;
  }

  isWindowOpen() {
    const now = new Date();
    const day = now.getDay();
    const hour = now.getHours();
    
    if (!this.allowedDays.includes(day)) return false;
    if (hour < this.allowedHours.start || hour >= this.allowedHours.end) return false;
    return true;
  }
}

const globalDeploymentWindow = new DeploymentWindow();

module.exports = {
  DeploymentWindow,
  globalDeploymentWindow
};
