import React from 'react';
import { ArrowRight, Wifi, AlertTriangle, Database } from 'lucide-react';
// Import data and type from content file
import { allLinksData, LinkData } from '../../content/links';

type LinkOverviewTileProps = {
  className?: string;
  scenarioId: string | null; // Null for global view
};

// LinkData type is now imported

// allLinksData is now imported

const LinkOverviewTile: React.FC<LinkOverviewTileProps> = ({ className, scenarioId }) => {
  const isGlobalView = scenarioId === null;

  // Filter the imported data
  const links = isGlobalView
    ? allLinksData
    : allLinksData.filter(link => link.scenarioId === scenarioId);

  const title = isGlobalView ? "Global Link & Channel Overview" : "Scenario Link & Channel Overview";

  return (
    <div className={`bg-albor-bg-dark/80 backdrop-blur-sm p-4 rounded border border-albor-bg-dark/50 ${className}`}>
      <h3 className="text-base font-semibold text-albor-light-gray mb-3">{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="text-albor-dark-gray border-b border-albor-bg-dark">
              {isGlobalView && <th className="py-1 px-2 whitespace-nowrap"><Database size={12} className="inline mr-1"/>Scenario</th>}
              <th className="py-1 px-2">Link</th>
              <th className="py-1 px-2">Freq/BW</th>
              <th className="py-1 px-2">Channel Model</th>
              <th className="py-1 px-2">Ports</th>
              <th className="py-1 px-2">SNR (dB)</th>
              <th className="py-1 px-2">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-albor-bg-dark">
            {links.map(link => (
              <tr key={link.id} className="hover:bg-albor-bg-dark/30">
                {isGlobalView && <td className="py-1.5 px-2 text-albor-dark-gray whitespace-nowrap">{link.scenarioId}</td>}
                <td className="py-1.5 px-2 flex items-center whitespace-nowrap">
                  {link.source} <ArrowRight size={12} className="mx-1 text-albor-dark-gray" /> {link.dest}
                </td>
                <td className="py-1.5 px-2 whitespace-nowrap">{link.freq} / {link.bw}</td>
                <td className="py-1.5 px-2">{link.model}</td>
                <td className="py-1.5 px-2 font-mono text-albor-dark-gray">{link.port}</td>
                <td className="py-1.5 px-2">{link.snr.toFixed(1)}</td>
                <td className="py-1.5 px-2">
                  {link.status === 'ok' && <Wifi size={14} className="text-green-500" title="OK"/>}
                  {link.status === 'warning' && <AlertTriangle size={14} className="text-yellow-500" title="Warning"/>}
                  {link.status === 'error' && <AlertTriangle size={14} className="text-red-500" title="Error"/>}
                </td>
              </tr>
            ))}
             {links.length === 0 && (
                <tr>
                    <td colSpan={isGlobalView ? 7 : 6} className="text-center py-4 text-albor-dark-gray italic">
                        No active links found {isGlobalView ? 'across all scenarios' : 'for this scenario'}.
                    </td>
                </tr>
             )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LinkOverviewTile;
