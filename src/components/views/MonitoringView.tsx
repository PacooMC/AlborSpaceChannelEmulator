import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
    import {
      LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area
    } from 'recharts';
    import {
        SignalMetrics, SpectrumDataPoint, LogEntry, LogLevel,
        generateSignalMetrics, generateSpectrumData, generateInitialSignalHistory,
        generateLogEntry, generateInitialLogs
    } from '../../content/monitoringData';
    import {
        Play, Pause, Settings, Maximize, Minimize, Table, Activity, AlertTriangle,
        ChevronDown, Check, ChevronsUpDown, AreaChart as AreaChartIcon, LineChart as LineChartIcon,
        List, Info, AlertCircle, WifiOff, X as CloseIcon,
        Square, Map, Server, TrendingUp, Trash2 // Added Trash2 for clear logs
    } from 'lucide-react';
    import type { Scenario, ScenarioStatus } from '../../content/scenarios';
    import { getSystemSummary, SystemSummaryStats } from '../../content/systemSummary'; // Import summary data fetcher

    // --- Child Components ---

    // Chart Tile Wrapper - Modified to pass onClearLogs to EventLogPanel if needed
    interface ChartTileProps {
      chartId: string;
      title: string;
      icon?: React.ElementType;
      children: React.ReactNode;
      className?: string;
      onMaximizeClick: () => void;
      // Add optional props for EventLogPanel specifics
      logCount?: number; // Pass log count to disable clear button
      onClearLogs?: () => void; // Pass clear function
    }
    const ChartTile: React.FC<ChartTileProps> = ({
        chartId,
        title,
        icon: Icon,
        children,
        className = '',
        onMaximizeClick,
        logCount, // Receive log count
        onClearLogs // Receive clear function
    }) => {
        const isEventLogPanel = chartId === 'eventlog';
        const canClearLogs = isEventLogPanel && logCount !== undefined && logCount > 0;

        return (
          <div className={`
            bg-albor-bg-dark/80 backdrop-blur-sm rounded border border-albor-bg-dark/50
            flex flex-col overflow-hidden relative p-2 chart-tile-bg h-full
            ${className}
          `}>
            <div className="flex justify-between items-center mb-1 flex-shrink-0 px-1">
              <div className="flex items-center space-x-1.5">
                 {Icon && <Icon size={12} className="text-albor-dark-gray" />}
                 <h3 className="text-xs font-semibold text-albor-light-gray">{title}</h3>
              </div>
              <div className="flex items-center space-x-1">
                {/* Clear Logs Button (only for Event Log panel) */}
                {isEventLogPanel && onClearLogs && (
                    <button
                        onClick={onClearLogs}
                        disabled={!canClearLogs}
                        className={`p-1 rounded text-albor-dark-gray transition-colors ${canClearLogs ? 'hover:text-red-400 hover:bg-albor-bg-dark/50' : 'opacity-50 cursor-not-allowed'}`}
                        title={canClearLogs ? "Clear Logs" : "No logs to clear"}
                    >
                        <Trash2 size={12} />
                    </button>
                )}
                {/* Maximize Button */}
                <button
                    onClick={onMaximizeClick}
                    className="p-1 rounded text-albor-dark-gray hover:text-albor-light-gray hover:bg-albor-bg-dark/50 transition-colors"
                    title="Maximize"
                >
                    <Maximize size={12} />
                </button>
              </div>
            </div>
            <div className="flex-1 min-h-0 w-full relative">
              <div className="absolute inset-0">
                 {/* Pass onClearLogs down if the child is EventLogPanel */}
                 {React.isValidElement(children) && chartId === 'eventlog'
                    ? React.cloneElement(children as React.ReactElement<any>, { onClearLogs })
                    : children
                 }
              </div>
            </div>
          </div>
        );
    };

    // Signal Chart Component (No changes needed)
    interface SignalChartProps { data: SignalMetrics[]; metric: keyof SignalMetrics; name: string; color: string; unit: string; }
    const SignalChart: React.FC<SignalChartProps> = ({ data, metric, name, color, unit }) => (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 15, left: -25, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-albor-dark-gray)" strokeOpacity={0.3} />
                <XAxis dataKey="timestamp" tickFormatter={(ts) => new Date(ts).toLocaleTimeString()} stroke="var(--color-albor-dark-gray)" fontSize={9} dy={5} interval="preserveStartEnd" />
                <YAxis stroke="var(--color-albor-dark-gray)" fontSize={9} dx={-3} domain={['auto', 'auto']} label={{ value: unit, angle: -90, position: 'insideLeft', fill: 'var(--color-albor-dark-gray)', fontSize: 9, dx: -10 }} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--color-albor-bg-dark)', border: '1px solid var(--color-albor-dark-gray)', fontSize: '11px' }} labelFormatter={(ts) => new Date(ts).toLocaleString()} formatter={(value: number) => [`${value.toFixed(2)} ${unit}`, name]} />
                <Line type="monotone" dataKey={metric} name={name} stroke={color} strokeWidth={1.5} dot={false} isAnimationActive={false} />
            </LineChart>
        </ResponsiveContainer>
    );

    // Spectrum Chart Component (No changes needed)
    interface SpectrumChartProps { data: SpectrumDataPoint[]; }
    const SpectrumChart: React.FC<SpectrumChartProps> = ({ data }) => (
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 15, left: -25, bottom: 5 }}>
                <defs> <linearGradient id="spectrumGradient" x1="0" y1="0" x2="0" y2="1"> <stop offset="5%" stopColor="var(--color-albor-orange)" stopOpacity={0.6}/> <stop offset="95%" stopColor="var(--color-albor-orange)" stopOpacity={0.1}/> </linearGradient> </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-albor-dark-gray)" strokeOpacity={0.3} />
                <XAxis dataKey="frequency" type="number" domain={['dataMin', 'dataMax']} stroke="var(--color-albor-dark-gray)" fontSize={9} dy={5} tickFormatter={(freq) => `${freq.toFixed(0)}`} label={{ value: "Freq (MHz)", position: 'insideBottom', fill: 'var(--color-albor-dark-gray)', fontSize: 9, dy: 5 }} interval="preserveStartEnd" />
                <YAxis stroke="var(--color-albor-dark-gray)" fontSize={9} dx={-3} domain={[-100, -30]} label={{ value: "Pwr (dBm)", angle: -90, position: 'insideLeft', fill: 'var(--color-albor-dark-gray)', fontSize: 9, dx: -10 }} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--color-albor-bg-dark)', border: '1px solid var(--color-albor-dark-gray)', fontSize: '11px' }} labelFormatter={(freq: number) => `${freq.toFixed(2)} MHz`} formatter={(value: number) => [`${value.toFixed(1)} dBm`, "Power"]} />
                <Area type="monotone" dataKey="power" stroke="var(--color-albor-orange)" fillOpacity={1} fill="url(#spectrumGradient)" strokeWidth={1.5} isAnimationActive={false} />
            </AreaChart>
        </ResponsiveContainer>
    );

    // Metrics Summary Table Component (No changes needed)
    interface MetricsSummaryTableProps { data: SignalMetrics[]; }
    const MetricsSummaryTable: React.FC<MetricsSummaryTableProps> = ({ data }) => {
      const summary = useMemo(() => { if (data.length === 0) return { current: null, min: {}, max: {} }; const current = data[data.length - 1]; const metrics: (keyof SignalMetrics)[] = ['snr', 'delay', 'receivedPower', 'doppler', 'elevation']; const minMax = metrics.reduce((acc, key) => { const values = data.map(d => d[key]).filter(v => typeof v === 'number'); if (values.length > 0) { acc.min[key] = Math.min(...values); acc.max[key] = Math.max(...values); } return acc; }, { min: {} as Partial<SignalMetrics>, max: {} as Partial<SignalMetrics> }); return { current, ...minMax }; }, [data]);
      const formatValue = (key: keyof SignalMetrics, value: number | undefined): string => { if (value === undefined || value === null) return 'N/A'; switch (key) { case 'snr': return `${value.toFixed(1)} dB`; case 'delay': return `${value.toFixed(1)} ms`; case 'receivedPower': return `${value.toFixed(1)} dBm`; case 'doppler': return `${value.toFixed(0)} Hz`; case 'elevation': return `${value.toFixed(1)}°`; case 'timestamp': return new Date(value).toLocaleTimeString(); default: return String(value); } };
      const metricsToDisplay: { key: keyof SignalMetrics; name: string }[] = [ { key: 'snr', name: 'SNR' }, { key: 'delay', name: 'Delay' }, { key: 'receivedPower', name: 'Rx Power' }, { key: 'doppler', name: 'Doppler' }, { key: 'elevation', name: 'Elevation' } ];
      return ( <div className="h-full w-full overflow-auto p-1 custom-scrollbar"> <table className="w-full text-left text-xs"> <thead> <tr className="text-albor-dark-gray border-b border-albor-bg-dark"> <th className="py-1 px-2">Metric</th> <th className="py-1 px-2 text-right">Current</th> <th className="py-1 px-2 text-right">Min</th> <th className="py-1 px-2 text-right">Max</th> </tr> </thead> <tbody className="divide-y divide-albor-bg-dark/50"> {metricsToDisplay.map(({ key, name }) => ( <tr key={key} className="hover:bg-albor-bg-dark/30"> <td className="py-1.5 px-2 font-medium text-albor-light-gray">{name}</td> <td className="py-1.5 px-2 text-right font-mono">{formatValue(key, summary.current?.[key])}</td> <td className="py-1.5 px-2 text-right font-mono text-albor-dark-gray">{formatValue(key, summary.min[key])}</td> <td className="py-1.5 px-2 text-right font-mono text-albor-dark-gray">{formatValue(key, summary.max[key])}</td> </tr> ))} </tbody> </table> </div> );
    };

    // Event Log Panel Component - Modified to accept onClearLogs
    interface EventLogPanelProps {
        logs: LogEntry[];
        onClearLogs?: () => void; // Make optional for modal usage
    }
    const EventLogPanel: React.FC<EventLogPanelProps> = ({ logs, onClearLogs }) => {
        const logEndRef = useRef<HTMLDivElement>(null);
        useEffect(() => { logEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [logs]);
        const getLogLevelInfo = (level: LogLevel): { icon: React.ElementType, color: string } => { switch (level) { case 'info': return { icon: Info, color: 'text-blue-400' }; case 'warn': return { icon: AlertTriangle, color: 'text-yellow-400' }; case 'error': return { icon: AlertCircle, color: 'text-red-500' }; case 'debug': return { icon: WifiOff, color: 'text-gray-500' }; default: return { icon: Info, color: 'text-gray-400' }; } };

        // Note: The clear button is now rendered in the ChartTile component
        // We just need the logs rendering logic here.

        return (
            <div className="h-full w-full overflow-y-auto custom-scrollbar pr-1 flex flex-col">
                <div className="space-y-1.5 flex-1">
                    {Array.isArray(logs) ? logs.map(log => {
                        const { icon: Icon, color } = getLogLevelInfo(log.level);
                        return (
                            <div key={log.id} className="flex items-start space-x-2 text-xs animate-fade-in-short">
                                <Icon size={14} className={`${color} flex-shrink-0 mt-0.5`} />
                                <div className="flex-1">
                                    <span className="text-albor-dark-gray mr-2">
                                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                    </span>
                                    {log.source && <span className="font-medium text-albor-light-gray/80 mr-1">[{log.source}]</span>}
                                    <span className="text-albor-light-gray">{log.message}</span>
                                </div>
                            </div>
                        );
                    }) : (
                        <p className="text-xs text-albor-dark-gray italic text-center py-4">Log data is unavailable.</p>
                    )}
                    {Array.isArray(logs) && logs.length === 0 && (
                        <p className="text-xs text-albor-dark-gray italic text-center py-4">No log entries.</p>
                    )}
                    <div ref={logEndRef} />
                </div>
            </div>
        );
    };

    // Modal Component for Maximized Chart (No changes needed)
    interface MaximizeModalProps { chartId: string; title: string; icon?: React.ElementType; children: React.ReactNode; onClose: () => void; }
    const MaximizeModal: React.FC<MaximizeModalProps> = ({ chartId, title, icon: Icon, children, onClose }) => (
        <div className="fixed inset-0 bg-albor-deep-space/90 backdrop-blur-sm z-50 flex flex-col p-4 animate-fade-in">
            <div className="flex justify-between items-center mb-2 flex-shrink-0 px-1 pb-2 border-b border-albor-dark-gray/50">
              <div className="flex items-center space-x-2"> {Icon && <Icon size={16} className="text-albor-dark-gray" />} <h3 className="text-base font-semibold text-albor-light-gray">{title}</h3> </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full text-albor-dark-gray hover:text-albor-light-gray hover:bg-albor-bg-dark/50 transition-colors relative z-[60]"
                style={{ position: 'relative', zIndex: 60 }}
                title="Close"
              >
                <CloseIcon size={18} />
              </button>
            </div>
            <div className="flex-1 w-full h-full overflow-hidden min-h-0 relative">
                <div className="absolute inset-0">
                    {children}
                </div>
            </div>
        </div>
    );

    // --- Import scenario-specific components ---
    import SystemSummaryTile from '../dashboard/SystemSummaryTile';
    import OrbitMapTile from '../dashboard/OrbitMapTile';
    import PortAssignmentMap from '../dashboard/PortAssignmentTile';

    // --- Main View Component ---

    const MAX_HISTORY = 100;
    const MAX_LOGS = 100;

    interface MonitoringViewProps {
        scenarioIdToMonitor: string | null; // ID of the scenario to monitor (prop from App)
        allRunningScenarios: Scenario[]; // Full list for dropdown
        onPauseScenario?: (id: string) => void;
        onResumeScenario?: (id: string) => void;
        onStopScenario?: (id: string) => void;
    }

    const MonitoringView: React.FC<MonitoringViewProps> = ({
        scenarioIdToMonitor,
        allRunningScenarios,
        onPauseScenario,
        onResumeScenario,
        onStopScenario
    }) => {
      const [selectedMonitorScenarioId, setSelectedMonitorScenarioId] = useState<string | null>(null);
      const [signalHistory, setSignalHistory] = useState<SignalMetrics[]>([]);
      const [spectrumData, setSpectrumData] = useState<SpectrumDataPoint[]>([]);
      const [eventLogs, setEventLogs] = useState<LogEntry[]>([]); // State for logs
      const [maximizedChartId, setMaximizedChartId] = useState<string | null>(null);
      const [isDropdownOpen, setIsDropdownOpen] = useState(false);
      const dropdownRef = useRef<HTMLDivElement>(null);

      // --- Effect to handle scenario selection logic (No changes needed) ---
      useEffect(() => {
        if (scenarioIdToMonitor !== null) {
            if (scenarioIdToMonitor !== selectedMonitorScenarioId) {
                console.log(`MonitoringView: Prop changed, setting scenario to: ${scenarioIdToMonitor}`);
                setSelectedMonitorScenarioId(scenarioIdToMonitor);
            }
        }
        else {
            if (selectedMonitorScenarioId === null) {
                const firstAvailable = allRunningScenarios.find(s => s.status === 'running' || s.status === 'paused');
                if (firstAvailable) {
                    console.log("MonitoringView: No prop ID, setting default scenario to:", firstAvailable.id);
                    setSelectedMonitorScenarioId(firstAvailable.id);
                } else {
                    console.log("MonitoringView: No prop ID and no available scenarios to set as default.");
                }
            }
        }
      }, [scenarioIdToMonitor, allRunningScenarios, selectedMonitorScenarioId]);

      const selectedScenario = useMemo(() => {
        return allRunningScenarios.find(s => s.id === selectedMonitorScenarioId);
      }, [selectedMonitorScenarioId, allRunningScenarios]);

      const isSelectedScenarioRunning = selectedScenario?.status === 'running';

      // Effect for data loading when selected ID changes (No changes needed)
      useEffect(() => {
        if (selectedMonitorScenarioId) {
          console.log(`MonitoringView: Loading data for ${selectedMonitorScenarioId}`);
          setSignalHistory(generateInitialSignalHistory(selectedMonitorScenarioId, MAX_HISTORY));
          setSpectrumData(generateSpectrumData(selectedMonitorScenarioId));
          setEventLogs(generateInitialLogs(selectedMonitorScenarioId, MAX_LOGS)); // Load initial logs
        } else {
          console.log("MonitoringView: No scenario selected, clearing data.");
          setSignalHistory([]);
          setSpectrumData([]);
          setEventLogs([]); // Clear logs
        }
      }, [selectedMonitorScenarioId]);

      // Effect for periodic updates (No changes needed)
      useEffect(() => {
        let intervalId: NodeJS.Timeout | null = null;
        if (isSelectedScenarioRunning && selectedMonitorScenarioId) {
          console.log(`MonitoringView: Starting updates for ${selectedMonitorScenarioId}`);
          intervalId = setInterval(() => {
            setSignalHistory(prev => [...prev, generateSignalMetrics(selectedMonitorScenarioId, prev[prev.length - 1])].slice(-MAX_HISTORY));
            setSpectrumData(generateSpectrumData(selectedMonitorScenarioId));
            const newLog = generateLogEntry(selectedMonitorScenarioId);
            if (newLog) setEventLogs(prevLogs => [...prevLogs, newLog].slice(-MAX_LOGS)); // Update logs
          }, 1000);
        } else {
            console.log(`MonitoringView: Stopping updates for ${selectedMonitorScenarioId} (Status: ${selectedScenario?.status})`);
        }
        return () => { if (intervalId) { console.log(`MonitoringView: Clearing update interval for ${selectedMonitorScenarioId}`); clearInterval(intervalId); } };
      }, [isSelectedScenarioRunning, selectedMonitorScenarioId]);

      // Effect for closing dropdown (No changes needed)
      useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => { if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsDropdownOpen(false); };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
      }, []);

      // --- Handlers ---
      const handleToggleMaximize = (chartId: string) => setMaximizedChartId(chartId);
      const handleCloseMaximize = () => setMaximizedChartId(null);
      const handleScenarioSelect = (id: string | null) => {
          if (id !== selectedMonitorScenarioId) {
              console.log("MonitoringView: User selected scenario:", id);
              setSelectedMonitorScenarioId(id);
          }
          setIsDropdownOpen(false);
      };
      const handlePauseResumeClick = () => {
        if (!selectedMonitorScenarioId) return;
        if (isSelectedScenarioRunning) { onPauseScenario?.(selectedMonitorScenarioId); }
        else { onResumeScenario?.(selectedMonitorScenarioId); }
      };
      const handleStopClick = () => {
        if (!selectedMonitorScenarioId) return;
        if (window.confirm(`Are you sure you want to stop scenario "${selectedScenario?.name}"?`)) {
            onStopScenario?.(selectedMonitorScenarioId);
        }
      };

      // --- NEW: Handler to clear logs ---
      const clearEventLogs = useCallback(() => {
          if (window.confirm("Are you sure you want to clear the event log?")) {
              console.log("MonitoringView: Clearing event logs.");
              setEventLogs([]);
          }
      }, []);
      // --- End New Handler ---

      const chartConfigs = useMemo(() => [
        { id: 'snr', metric: 'snr' as keyof SignalMetrics, name: 'SNR', color: '#34D399', unit: 'dB', icon: LineChartIcon },
        { id: 'delay', metric: 'delay' as keyof SignalMetrics, name: 'Delay', color: '#60A5FA', unit: 'ms', icon: LineChartIcon },
        { id: 'power', metric: 'receivedPower' as keyof SignalMetrics, name: 'Rx Power', color: '#F87171', unit: 'dBm', icon: LineChartIcon },
        { id: 'doppler', metric: 'doppler' as keyof SignalMetrics, name: 'Doppler', color: '#FACC15', unit: 'Hz', icon: LineChartIcon },
        { id: 'elevation',metric: 'elevation' as keyof SignalMetrics, name: 'Elevation', color: '#A78BFA', unit: '°', icon: TrendingUp },
      ], []);

      const currentSelectionName = selectedScenario?.name ?? 'Select Scenario...';

      const maximizedChartConfig = useMemo(() => {
          if (!maximizedChartId) return null;
          if (maximizedChartId === 'spectrum') return { id: 'spectrum', title: 'Spectrum Analysis', icon: AreaChartIcon };
          if (maximizedChartId === 'summary') return { id: 'summary', title: 'Metrics Summary', icon: Table };
          if (maximizedChartId === 'eventlog') return { id: 'eventlog', title: 'Event Log', icon: List };
          if (maximizedChartId === 'scenario-details') return { id: 'scenario-details', title: 'Scenario Details', icon: Settings };
          if (maximizedChartId === 'orbit-map') return { id: 'orbit-map', title: 'Orbit Map', icon: Map };
          if (maximizedChartId === 'port-map') return { id: 'port-map', title: 'Port Assignment Map', icon: Server };
          const signalConfig = chartConfigs.find(c => c.id === maximizedChartId);
          if (signalConfig) {
              return {
                  id: signalConfig.id,
                  title: `${signalConfig.name} vs Time`,
                  icon: signalConfig.icon,
                  metric: signalConfig.metric,
                  name: signalConfig.name,
                  color: signalConfig.color,
                  unit: signalConfig.unit
              };
          }
          return null;
      }, [maximizedChartId, chartConfigs]);


      // --- Main Render Logic ---
      return (
        <div className="text-white flex flex-col h-full">
          {/* Header/Controls (No changes needed) */}
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-albor-bg-dark/50 flex-shrink-0 gap-4 px-1">
            <h1 className="text-xl font-semibold text-albor-light-gray flex-shrink-0">
                Scenario Monitoring {selectedScenario ? `: ${selectedScenario.name}` : ''}
            </h1>
            <div className="flex items-center gap-4 flex-shrink-0">
                <div className="relative" ref={dropdownRef}>
                  <label htmlFor="monitor-scenario-select" className="text-xs text-albor-dark-gray absolute -top-3.5 left-0">Scenario</label>
                  <button id="monitor-scenario-select" onClick={() => setIsDropdownOpen(!isDropdownOpen)} disabled={allRunningScenarios.length === 0}
                    className="flex items-center justify-between px-3 py-1.5 min-w-[220px] max-w-xs bg-albor-bg-dark/60 border border-albor-dark-gray/70 rounded text-sm text-albor-light-gray hover:border-albor-light-gray/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    title="Select Scenario to Monitor" >
                    <span className="truncate mr-2">{currentSelectionName}</span>
                    <ChevronsUpDown size={16} className="text-albor-dark-gray flex-shrink-0" />
                  </button>
                  {isDropdownOpen && allRunningScenarios.length > 0 && (
                    <div className="absolute top-full right-0 mt-1 w-60 bg-albor-bg-dark border border-albor-dark-gray rounded shadow-lg py-1 z-50">
                      {allRunningScenarios.map(scenario => ( <button key={scenario.id} onClick={() => handleScenarioSelect(scenario.id)} className={`flex items-center justify-between w-full px-3 py-1.5 text-left text-xs transition-colors ${ selectedMonitorScenarioId === scenario.id ? 'bg-albor-orange/20 text-albor-orange' : 'text-albor-light-gray hover:bg-albor-bg-dark/70' }`} > <span className="truncate">{scenario.name}</span> {selectedMonitorScenarioId === scenario.id && <Check size={14} />} </button> ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                    <button onClick={handlePauseResumeClick} disabled={!selectedMonitorScenarioId || selectedScenario?.status === 'stopped'}
                      className={`flex items-center space-x-1.5 px-3 py-1 rounded text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 ${ isSelectedScenarioRunning ? 'bg-yellow-500 hover:bg-yellow-600 text-black' : 'bg-green-500 hover:bg-green-600 text-white' }`}
                      title={isSelectedScenarioRunning ? 'Pause Simulation' : 'Resume Simulation'} >
                      {isSelectedScenarioRunning ? <Pause size={14} /> : <Play size={14} />}
                      <span>{isSelectedScenarioRunning ? 'Pause' : 'Resume'}</span>
                    </button>
                     <button onClick={handleStopClick} disabled={!selectedMonitorScenarioId || selectedScenario?.status === 'stopped'}
                      className={`flex items-center space-x-1.5 px-3 py-1 rounded text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 bg-red-600 hover:bg-red-700 text-white`}
                      title="Stop Simulation" >
                      <Square size={14} />
                      <span>Stop</span>
                    </button>
                </div>
            </div>
          </div>

          {!selectedMonitorScenarioId ? (
             <div className="flex-1 flex flex-col items-center justify-center"> <div className="text-center p-6 bg-albor-bg-dark/50 rounded-lg border border-albor-dark-gray"> <Activity size={48} className="mx-auto text-albor-orange mb-4" /> <h2 className="text-lg font-semibold text-albor-light-gray mb-2">No Scenario Selected</h2> <p className="text-sm text-albor-dark-gray"> {allRunningScenarios.length > 0 ? "Select an active scenario from the dropdown above to monitor." : "There are no active scenarios to monitor."} </p> </div> </div>
            ) : (
              <div className={`flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-y-auto p-1 custom-scrollbar min-h-0`}>

                {/* Column1: Scenario Details & Map (No changes needed) */}
                <div className="lg:col-span-1 flex flex-col gap-4">
                    <div className="min-h-[250px] flex-[1]">
                        <ChartTile
                            key={`scenario-details-${selectedMonitorScenarioId}`}
                            chartId="scenario-details"
                            title="Scenario Details"
                            icon={Settings}
                            onMaximizeClick={() => handleToggleMaximize('scenario-details')}
                        >
                            <SystemSummaryTile
                                viewMode="scenario"
                                scenarioId={selectedMonitorScenarioId}
                                scenario={selectedScenario}
                            />
                        </ChartTile>
                    </div>
                    <div className="min-h-[300px] flex-[2]">
                        <ChartTile
                            key={`orbit-map-${selectedMonitorScenarioId}`}
                            chartId="orbit-map"
                            title="Orbit Map"
                            icon={Map}
                            onMaximizeClick={() => handleToggleMaximize('orbit-map')}
                        >
                            <OrbitMapTile scenarioId={selectedMonitorScenarioId} />
                        </ChartTile>
                    </div>
                </div>

                {/* Column 2 & 3: Signal Charts & Spectrum */}
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* FIX: Removed extra '<' */}
                    <div className={`md:col-span-2 min-h-[200px]`}>
                      <ChartTile
                        key={`spectrum-${selectedMonitorScenarioId}`}
                        chartId="spectrum"
                        title="Spectrum Analysis"
                        icon={AreaChartIcon}
                        onMaximizeClick={() => handleToggleMaximize('spectrum')}
                      >
                        <SpectrumChart data={spectrumData} />
                      </ChartTile>
                    </div>
                    {chartConfigs.map(config => (
                      <div key={`${config.id}-${selectedMonitorScenarioId}`} className="min-h-[180px]">
                        <ChartTile
                          chartId={config.id}
                          title={config.name}
                          icon={config.icon}
                          onMaximizeClick={() => handleToggleMaximize(config.id)}
                        >
                          <SignalChart
                            data={signalHistory}
                            metric={config.metric}
                            name={config.name}
                            color={config.color}
                            unit={config.unit}
                          />
                        </ChartTile>
                      </div>
                    ))}
                    <div className="min-h-[180px]">
                      <ChartTile
                        key={'summary-tile-' + (selectedMonitorScenarioId || 'none')} // Simplified key structure
                        chartId="summary"
                        title="Metrics Summary"
                        icon={Table}
                        onMaximizeClick={() => handleToggleMaximize('summary')}
                      >
                        <MetricsSummaryTable data={signalHistory} />
                      </ChartTile>
                    </div>
                </div>

                {/* Column 4: Ports & Logs */}
                <div className="lg:col-span-1 flex flex-col gap-4">
                    <div className="min-h-[250px]">
                        <ChartTile
                            key={`port-map-${selectedMonitorScenarioId}`}
                            chartId="port-map"
                            title="Port Assignment List"
                            icon={Server}
                            onMaximizeClick={() => handleToggleMaximize('port-map')}
                        >
                            <PortAssignmentMap scenarioId={selectedMonitorScenarioId} displayMode="list" />
                        </ChartTile>
                    </div>
                    <div className="flex-1 min-h-[250px]">
                        {/* Pass clearEventLogs and logCount to the Event Log ChartTile */}
                        <ChartTile
                            key={`eventlog-${selectedMonitorScenarioId}`}
                            chartId="eventlog"
                            title="Event Log"
                            icon={List}
                            onMaximizeClick={() => handleToggleMaximize('eventlog')}
                            onClearLogs={clearEventLogs} // Pass the clear function
                            logCount={eventLogs.length} // Pass the log count
                        >
                            <EventLogPanel logs={eventLogs} />
                        </ChartTile>
                    </div>
                </div>

              </div>
            )}

          {/* Maximized Chart Modal (No changes needed here) */}
          {maximizedChartId && maximizedChartConfig && (
            <MaximizeModal
              chartId={maximizedChartId}
              title={maximizedChartConfig.title}
              icon={maximizedChartConfig.icon}
              onClose={handleCloseMaximize}
            >
              {maximizedChartId === 'spectrum' && <SpectrumChart data={spectrumData} />}
              {maximizedChartId === 'summary' && <MetricsSummaryTable data={signalHistory} />}
              {maximizedChartId === 'eventlog' && <EventLogPanel logs={eventLogs} />} {/* Modal doesn't need clear button */}
              {maximizedChartId === 'scenario-details' && <SystemSummaryTile viewMode="scenario" scenarioId={selectedMonitorScenarioId} scenario={selectedScenario} />}
              {maximizedChartId === 'orbit-map' && <OrbitMapTile scenarioId={selectedMonitorScenarioId} isMaximized={true} />}
              {maximizedChartId === 'port-map' && <PortAssignmentMap scenarioId={selectedMonitorScenarioId} displayMode="map" />}
              {chartConfigs.find(c => c.id === maximizedChartId) && maximizedChartConfig.metric && (
                <SignalChart
                  data={signalHistory}
                  metric={maximizedChartConfig.metric as keyof SignalMetrics}
                  name={maximizedChartConfig.name}
                  color={maximizedChartConfig.color}
                  unit={maximizedChartConfig.unit}
                />
              )}
            </MaximizeModal>
          )}
        </div>
      );
    };

    export default MonitoringView;
