import React from 'react';
import { Satellite, RadioTower, Smartphone, Network, Clock, BarChart } from 'lucide-react';

interface SystemSummaryTileProps {
  scenarioId: string | null; // Null for global view
}

const StatItem: React.FC<{ icon: React.ElementType; label: string; value: string | number }> = ({ icon: Icon, label, value }) => (
  <div className="flex items-center space-x-2 text-sm">
    <Icon className="text-albor-orange" size={16} />
    <span className="text-albor-dark-gray">{label}:</span>
    <span className="text-albor-light-gray font-medium">{value}</span>
  </div>
);

const SystemSummaryTile: React.FC<SystemSummaryTileProps> = ({ scenarioId }) => {
  const isGlobalView = scenarioId === null;

  // --- Dummy Data Adaptation ---
  // Global values (could be sum or average later)
  const globalSatellites = 5;
  const globalGroundStations = 4;
  const globalUserTerminals = 50;
  const globalActiveLinks = 25;
  const globalUsedPorts = "45/128"; // Total ports used across system
  const globalUptime = "7d 04:15:00"; // System uptime

  // Scenario-specific values (example for 'leo-test-1')
  const scenarioSatellites = 3;
  const scenarioGroundStations = 2;
  const scenarioUserTerminals = 15;
  const scenarioActiveLinks = 8;
  const scenarioUsedPorts = "16/64"; // Fixed: Added closing quote
  const scenarioUptime = "1d 02:30:15"; // Scenario-specific uptime

  // Determine which data to display
  const satellites = isGlobalView ? globalSatellites : scenarioSatellites;
  const groundStations = isGlobalView ? globalGroundStations : scenarioGroundStations;
  const userTerminals = isGlobalView ? globalUserTerminals : scenarioUserTerminals;
  const activeLinks = isGlobalView ? globalActiveLinks : scenarioActiveLinks;
  const usedPorts = isGlobalView ? globalUsedPorts : scenarioUsedPorts;
  const uptime = isGlobalView ? globalUptime : scenarioUptime;
  const title = isGlobalView ? "Global System Summary" : "Scenario Summary";

  return (
    <div className="bg-albor-bg-dark/80 backdrop-blur-sm p-4 rounded border border-albor-bg-dark/50 flex flex-col min-h-[200px]">
      <h3 className="text-base font-semibold text-albor-light-gray mb-3">{title}</h3>
      <div className="flex-1 grid grid-cols-2 gap-y-3 gap-x-4">
        <StatItem icon={Satellite} label="Satellites" value={satellites} />
        <StatItem icon={RadioTower} label="Ground Stations" value={groundStations} />
        <StatItem icon={Smartphone} label="User Terminals" value={userTerminals} />
        <StatItem icon={Network} label="Active Links" value={activeLinks} />
        <StatItem icon={BarChart} label="Used Ports" value={usedPorts} />
        <StatItem icon={Clock} label="Uptime" value={uptime} />
      </div>
    </div>
  );
};

export default SystemSummaryTile;
