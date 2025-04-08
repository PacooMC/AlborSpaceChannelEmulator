import React from 'react';
            import { ArrowRight, Wifi, AlertTriangle, Info, Link2Off } from 'lucide-react'; // Changed LinkOff to Link2Off
            import { ScenarioEdge, ScenarioNode, ScenarioType } from './types';

            interface LinkOverviewPanelProps {
              links: ScenarioEdge[];
              nodes: ScenarioNode[];
              scenarioType: ScenarioType;
            }

            const LinkOverviewPanel: React.FC<LinkOverviewPanelProps> = ({ links = [], nodes = [], scenarioType }) => {

              const getNodeName = (nodeId: string): string => {
                return nodes?.find(n => n.id === nodeId)?.data?.name || 'Unknown';
              };

              // Dummy data for placeholder properties (replace later with actual edge data)
              const getLinkDetails = (link: ScenarioEdge) => {
                const hash = link.id.charCodeAt(link.id.length - 1) % 3;
                const snrBase = link.id.charCodeAt(0) % 15 + 5;
                return {
                    freq: link.data?.frequency || 'N/A',
                    bw: link.data?.bandwidth || 'N/A',
                    model: link.data?.channelModel || 'N/A',
                    snr: snrBase + Math.random() * 5,
                    status: ['ok', 'warning', 'error'][hash] as 'ok' | 'warning' | 'error',
                };
              }

              return (
                <div className="bg-albor-bg-dark/50 p-2 flex flex-col overflow-hidden">
                  <h4 className="text-sm font-semibold text-albor-light-gray mb-1 flex-shrink-0">Link Overview</h4>
                  <div className="overflow-auto flex-1 -mr-2 pr-2">
                    {scenarioType === 'realistic' ? (
                        // Realistic Mode Message
                        <div className="flex flex-col items-center justify-center h-full text-center text-albor-dark-gray text-xs p-4 space-y-2">
                            {/* Changed LinkOff to Link2Off */}
                            <Link2Off size={24} className="mb-1 opacity-50"/>
                            <p className="font-semibold">Links Calculated Automatically</p>
                            <p>In Realistic mode, links are determined by satellite orbits, ground positions, and line-of-sight calculations during simulation.</p>
                            <p className="italic">(Manual link creation is disabled)</p>
                        </div>
                    ) : (
                        // Custom Mode Table
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="text-albor-dark-gray border-b border-albor-bg-dark sticky top-0 bg-albor-bg-dark/50 backdrop-blur-sm z-10">
                              <th className="py-1 px-1">Link</th>
                              <th className="py-1 px-1">Freq/BW</th>
                              <th className="py-1 px-1">Channel Model</th>
                              <th className="py-1 px-1">SNR (dB)</th>
                              <th className="py-1 px-1">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-albor-bg-dark/50">
                            {(links || []).map(link => {
                              if (!link || !link.id || !link.source || !link.target) return null;
                              const details = getLinkDetails(link);
                              const sourceName = getNodeName(link.source);
                              const targetName = getNodeName(link.target);
                              return (
                                <tr key={link.id} className="hover:bg-albor-bg-dark/30">
                                  <td className="py-1 px-1 flex items-center whitespace-nowrap" title={`${sourceName} -> ${targetName}`}>
                                    <span className="truncate max-w-[60px]">{sourceName}</span>
                                    <ArrowRight size={10} className="mx-0.5 text-albor-dark-gray flex-shrink-0" />
                                    <span className="truncate max-w-[60px]">{targetName}</span>
                                  </td>
                                  <td className="py-1 px-1 whitespace-nowrap">{details.freq} / {details.bw}</td>
                                  <td className="py-1 px-1">{details.model}</td>
                                  <td className="py-1 px-1">{details.snr.toFixed(1)}</td>
                                  <td className="py-1 px-1">
                                    {details.status === 'ok' && <Wifi size={12} className="text-green-500" title="OK"/>}
                                    {details.status === 'warning' && <AlertTriangle size={12} className="text-yellow-500" title="Warning"/>}
                                    {details.status === 'error' && <AlertTriangle size={12} className="text-red-500" title="Error"/>}
                                  </td>
                                </tr>
                              );
                            })}
                             {(links || []).length === 0 && (
                                <tr>
                                    <td colSpan={5} className="text-center py-4 text-albor-dark-gray italic">
                                        No links defined. Drag between node handles on the canvas to create links.
                                    </td>
                                </tr>
                             )}
                          </tbody>
                        </table>
                    )}
                  </div>
                </div>
              );
            };

            export default LinkOverviewPanel;
