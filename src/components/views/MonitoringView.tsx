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
    List, Info, AlertCircle, WifiOff, X as CloseIcon
} from 'lucide-react';
import type { Scenario } from '../../content/scenarios';

// --- Child Components ---

// Chart Tile Wrapper
interface ChartTileProps {
  chartId: string;
  title: string;
  icon?: React.ElementType;
  children: React.ReactNode;
  className?: string;
  onMaximizeClick: () => void;
}
const ChartTile: React.FC<ChartTileProps> = ({ chartId, title, icon: Icon, children, className = '', onMaximizeClick }) => {
    return (
      <div className={`
        bg-albor-bg-dark/80 backdrop-blur-sm rounded border border-albor-bg-dark/50
        flex flex-col overflow-hidden relative p-2 chart-tile-bg
        ${className}
      `}>
        <div className="flex justify-between items-center mb-1 flex-shrink-0 px-1">
          <div className="flex items-center space-x-1.5">
             {Icon && <Icon size={12} className="text-albor-dark-gray" />}
             <h3 className="text-xs font-semibold text-albor-light-gray">{title}</h3>
          </div>
          <button
            onClick={onMaximizeClick}
            className="p-1 rounded text-albor-dark-gray hover:text-albor-light-gray hover:bg-albor-bg-dark/50 transition-colors"
            title="Maximize"
          >
            <Maximize size={12} />
          </button>
        </div>
        {/* CRUCIAL: flex-1 AND min-h-0 for flex child height calculation */}
        <div className="flex-1 min-h-0 w-full h-full overflow-hidden">
          {children}
        </div>
      </div>
    );
};


// Signal Chart Component - Simplified
interface SignalChartProps {
  data: SignalMetrics[];
  metric: keyof SignalMetrics;
  name: string;
  color: string;
  unit: string;
}
const SignalChart: React.FC<SignalChartProps> = ({ data, metric, name, color, unit }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 20, left: -20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-albor-dark-gray)" strokeOpacity={0.3} />
            <XAxis dataKey="timestamp" tickFormatter={(ts) => new Date(ts).toLocaleTimeString()} stroke="var(--color-albor-dark-gray)" fontSize={10} dy={5} interval="preserveStartEnd" />
            <YAxis stroke="var(--color-albor-dark-gray)" fontSize={10} dx={-5} domain={['auto', 'auto']} label={{ value: unit, angle: -90, position: 'insideLeft', fill: 'var(--color-albor-dark-gray)', fontSize: 10, dx: -15 }} />
            <Tooltip contentStyle={{ backgroundColor: 'var(--color-albor-bg-dark)', border: '1px solid var(--color-albor-dark-gray)', fontSize: '12px' }} labelFormatter={(ts) => new Date(ts).toLocaleString()} formatter={(value: number) => [`${value.toFixed(2)} ${unit}`, name]} />
            <Line type="monotone" dataKey={metric} name={name} stroke={color} strokeWidth={1.5} dot={false} isAnimationActive={false} />
        </LineChart>
    </ResponsiveContainer>
  );
};

// Spectrum Chart Component - Simplified
interface SpectrumChartProps {
  data: SpectrumDataPoint[];
}
const SpectrumChart: React.FC<SpectrumChartProps> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 20, left: -20, bottom: 20 }}>
            <defs> <linearGradient id="spectrumGradient" x1="0" y1="0" x2="0" y2="1"> <stop offset="5%" stopColor="var(--color-albor-orange)" stopOpacity={0.6}/> <stop offset="95%" stopColor="var(--color-albor-orange)" stopOpacity={0.1}/> </linearGradient> </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-albor-dark-gray)" strokeOpacity={0.3} />
            <XAxis dataKey="frequency" type="number" domain={['dataMin', 'dataMax']} stroke="var(--color-albor-dark-gray)" fontSize={10} dy={5} tickFormatter={(freq) => `${freq.toFixed(0)}`} label={{ value: "Frequency (MHz)", position: 'insideBottom', fill: 'var(--color-albor-dark-gray)', fontSize: 10, dy: 15 }} interval="preserveStartEnd" />
            <YAxis stroke="var(--color-albor-dark-gray)" fontSize={10} dx={-5} domain={[-100, -30]} label={{ value: "Power (dBm)", angle: -90, position: 'insideLeft', fill: 'var(--color-albor-dark-gray)', fontSize: 10, dx: -15 }} />
            <Tooltip contentStyle={{ backgroundColor: 'var(--color-albor-bg-dark)', border: '1px solid var(--color-albor-dark-gray)', fontSize: '12px' }} labelFormatter={(freq: number) => `${freq.toFixed(2)} MHz`} formatter={(value: number) => [`${value.toFixed(1)} dBm`, "Power"]} />
            <Area type="monotone" dataKey="power" stroke="var(--color-albor-orange)" fillOpacity={1} fill="url(#spectrumGradient)" strokeWidth={1.5} isAnimationActive={false} />
        </AreaChart>
    </ResponsiveContainer>
  );
};

// Metrics Summary Table Component
interface MetricsSummaryTableProps { data: SignalMetrics[]; }
const MetricsSummaryTable: React.FC<MetricsSummaryTableProps> = ({ data }) => {
  const summary = useMemo(() => { if (data.length === 0) return { current: null, min: {}, max: {} }; const current = data[data.length - 1]; const metrics: (keyof SignalMetrics)[] = ['snr', 'delay', 'receivedPower', 'doppler']; const minMax = metrics.reduce((acc, key) => { const values = data.map(d => d[key]).filter(v => typeof v === 'number'); if (values.length > 0) { acc.min[key] = Math.min(...values); acc.max[key] = Math.max(...values); } return acc; }, { min: {} as Partial<SignalMetrics>, max: {} as Partial<SignalMetrics> }); return { current, ...minMax }; }, [data]);
  const formatValue = (key: keyof SignalMetrics, value: number | undefined): string => { if (value === undefined || value === null) return 'N/A'; switch (key) { case 'snr': return `${value.toFixed(1)} dB`; case 'delay': return `${value.toFixed(1)} ms`; case 'receivedPower': return `${value.toFixed(1)} dBm`; case 'doppler': return `${value.toFixed(0)} Hz`; case 'timestamp': return new Date(value).toLocaleTimeString(); default: return String(value); } };
  const metricsToDisplay: { key: keyof SignalMetrics; name: string }[] = [ { key: 'snr', name: 'SNR' }, { key: 'delay', name: 'Delay' }, { key: 'receivedPower', name: 'Rx Power' }, { key: 'doppler', name: 'Doppler' }, ];
  return ( <div className="h-full w-full overflow-auto p-1 custom-scrollbar"> <table className="w-full text-left text-xs"> <thead> <tr className="text-albor-dark-gray border-b border-albor-bg-dark"> <th className="py-1 px-2">Metric</th> <th className="py-1 px-2 text-right">Current</th> <th className="py-1 px-2 text-right">Min</th> <th className="py-1 px-2 text-right">Max</th> </tr> </thead> <tbody className="divide-y divide-albor-bg-dark/50"> {metricsToDisplay.map(({ key, name }) => ( <tr key={key} className="hover:bg-albor-bg-dark/30"> <td className="py-1.5 px-2 font-medium text-albor-light-gray">{name}</td> <td className="py-1.5 px-2 text-right font-mono">{formatValue(key, summary.current?.[key])}</td> <td className="py-1.5 px-2 text-right font-mono text-albor-dark-gray">{formatValue(key, summary.min[key])}</td> <td className="py-1.5 px-2 text-right font-mono text-albor-dark-gray">{formatValue(key, summary.max[key])}</td> </tr> ))} </tbody> </table> </div> );
};

// Event Log Panel Component
interface EventLogPanelProps { logs: LogEntry[]; }
const EventLogPanel: React.FC<EventLogPanelProps> = ({ logs }) => {
    const logEndRef = useRef<HTMLDivElement>(null);
    useEffect(() => { logEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [logs]);
    const getLogLevelInfo = (level: LogLevel): { icon: React.ElementType, color: string } => { switch (level) { case 'info': return { icon: Info, color: 'text-blue-400' }; case 'warn': return { icon: AlertTriangle, color: 'text-yellow-400' }; case 'error': return { icon: AlertCircle, color: 'text-red-500' }; case 'debug': return { icon: WifiOff, color: 'text-gray-500' }; default: return { icon: Info, color: 'text-gray-400' }; } };
    return (
        // This div scrolls
        <div className="h-full w-full overflow-y-auto custom-scrollbar pr-1">
            <div className="space-y-1.5">
                {logs.map(log => { const { icon: Icon, color } = getLogLevelInfo(log.level); return ( <div key={log.id} className="flex items-start space-x-2 text-xs animate-fade-in-short"> <Icon size={14} className={`${color} flex-shrink-0 mt-0.5`} /> <div className="flex-1"> <span className="text-albor-dark-gray mr-2"> {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} </span> {log.source && <span className="font-medium text-albor-light-gray/80 mr-1">[{log.source}]</span>} <span className="text-albor-light-gray">{log.message}</span> </div> </div> ); })}
                {logs.length === 0 && ( <p className="text-xs text-albor-dark-gray italic text-center py-4">No log entries yet.</p> )}
                <div ref={logEndRef} />
            </div>
        </div>
    );
};

// Modal Component for Maximized Chart
interface MaximizeModalProps { chartId: string; title: string; icon?: React.ElementType; children: React.ReactNode; onClose: () => void; }
const MaximizeModal: React.FC<MaximizeModalProps> = ({ chartId, title, icon: Icon, children, onClose }) => (
    <div className="fixed inset-0 bg-albor-deep-space/90 backdrop-blur-sm z-50 flex flex-col p-4 animate-fade-in">
        <div className="flex justify-between items-center mb-2 flex-shrink-0 px-1 pb-2 border-b border-albor-dark-gray/50">
          <div className="flex items-center space-x-2"> {Icon && <Icon size={16} className="text-albor-dark-gray" />} <h3 className="text-base font-semibold text-albor-light-gray">{title}</h3> </div>
          <button onClick={onClose} className="p-1.5 rounded-full text-albor-dark-gray hover:text-albor-light-gray hover:bg-albor-bg-dark/50 transition-colors" title="Close" > <CloseIcon size={18} /> </button>
        </div>
        <div className="flex-1 w-full h-full overflow-hidden min-h-0"> {/* Added min-h-0 */}
            {children}
        </div>
    </div>
);


// --- Main View Component ---

const MAX_HISTORY = 100;
const MAX_LOGS = 100;

interface MonitoringViewProps { runningScenarios: Scenario[]; }

const MonitoringView: React.FC<MonitoringViewProps> = ({ runningScenarios }) => {
  const [selectedMonitorScenarioId, setSelectedMonitorScenarioId] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(true);
  const [signalHistory, setSignalHistory] = useState<SignalMetrics[]>([]);
  const [spectrumData, setSpectrumData] = useState<SpectrumDataPoint[]>([]);
  const [eventLogs, setEventLogs] = useState<LogEntry[]>([]);
  const [maximizedChartId, setMaximizedChartId] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Effect for default selection and data loading
  useEffect(() => {
    let currentSelection = selectedMonitorScenarioId;
    // If no scenario is selected OR the selected one is no longer running...
    if (!currentSelection || !runningScenarios.some(s => s.id === currentSelection)) {
      // ...select the first running scenario, or null if none are running.
      currentSelection = runningScenarios.length > 0 ? runningScenarios[0].id : null;
    }
    // If the effective selection changed, update the state
    if (currentSelection !== selectedMonitorScenarioId) {
      setSelectedMonitorScenarioId(currentSelection);
    }
    // Load data based on the current selection (or clear if null)
    if (currentSelection) {
      setSignalHistory(generateInitialSignalHistory(currentSelection, MAX_HISTORY));
      setSpectrumData(generateSpectrumData(currentSelection));
      setEventLogs(generateInitialLogs(currentSelection, MAX_LOGS));
    } else {
      setSignalHistory([]); setSpectrumData([]); setEventLogs([]);
    }
  }, [runningScenarios, selectedMonitorScenarioId]); // Rerun when runningScenarios list changes or the selection changes


  // Effect for periodic updates
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    if (isRunning && selectedMonitorScenarioId) {
      intervalId = setInterval(() => {
        setSignalHistory(prev => [...prev, generateSignalMetrics(selectedMonitorScenarioId, prev[prev.length - 1])].slice(-MAX_HISTORY));
        setSpectrumData(generateSpectrumData(selectedMonitorScenarioId));
        const newLog = generateLogEntry(selectedMonitorScenarioId);
        if (newLog) setEventLogs(prevLogs => [...prevLogs, newLog].slice(-MAX_LOGS));
      }, 1000);
    }
    return () => { if (intervalId) clearInterval(intervalId); };
  }, [isRunning, selectedMonitorScenarioId]);

  // Effect for closing dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => { if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsDropdownOpen(false); };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  const handleToggleMaximize = (chartId: string) => setMaximizedChartId(chartId);
  const handleCloseMaximize = () => setMaximizedChartId(null);
  const handleScenarioSelect = (id: string | null) => { if (id !== selectedMonitorScenarioId) setSelectedMonitorScenarioId(id); setIsDropdownOpen(false); };

  const chartConfigs = useMemo(() => [
    { id: 'snr', metric: 'snr' as keyof SignalMetrics, name: 'SNR', color: '#34D399', unit: 'dB', icon: LineChartIcon },
    { id: 'delay', metric: 'delay' as keyof SignalMetrics, name: 'Delay', color: '#60A5FA', unit: 'ms', icon: LineChartIcon },
    { id: 'power', metric: 'receivedPower' as keyof SignalMetrics, name: 'Rx Power', color: '#F87171', unit: 'dBm', icon: LineChartIcon },
    { id: 'doppler', metric: 'doppler' as keyof SignalMetrics, name: 'Doppler', color: '#FACC15', unit: 'Hz', icon: LineChartIcon },
  ], []);

  const currentSelectionName = selectedMonitorScenarioId ? runningScenarios.find(s => s.id === selectedMonitorScenarioId)?.name ?? 'Select...' : 'Select...';

  const maximizedChartConfig = useMemo(() => {
      if (!maximizedChartId) return null;
      if (maximizedChartId === 'spectrum') return { id: 'spectrum', title: 'Spectrum Analysis', icon: AreaChartIcon };
      if (maximizedChartId === 'summary') return { id: 'summary', title: 'Metrics Summary', icon: Table };
      if (maximizedChartId === 'eventlog') return { id: 'eventlog', title: 'Event Log', icon: List };
      // Find the config for signal charts
      const signalConfig = chartConfigs.find(c => c.id === maximizedChartId);
      if (signalConfig) {
          return {
              ...signalConfig,
              title: `${signalConfig.name} vs Time` // Add title here if needed
          };
      }
      return null; // Should not happen if IDs are correct
  }, [maximizedChartId, chartConfigs]);


  // --- Main Render Logic ---
  return (
    <div className="text-white flex flex-col h-full">
      {/* Header/Controls */}
      <div className="flex justify-between items-center mb-4 pb-2 border-b border-albor-bg-dark/50 flex-shrink-0 gap-4 px-1">
        <h1 className="text-xl font-semibold text-albor-light-gray flex-shrink-0">Monitoring</h1>
        <div className="flex items-center gap-4 flex-shrink-0">
            {/* Scenario Selector Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <label htmlFor="monitor-scenario-select" className="text-xs text-albor-dark-gray absolute -top-3.5 left-0">Scenario</label>
              <button id="monitor-scenario-select" onClick={() => setIsDropdownOpen(!isDropdownOpen)} disabled={runningScenarios.length === 0}
                className="flex items-center justify-between px-3 py-1.5 min-w-[220px] max-w-xs bg-albor-bg-dark/60 border border-albor-dark-gray/70 rounded text-sm text-albor-light-gray hover:border-albor-light-gray/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                title="Select Scenario to Monitor" >
                <span className="truncate mr-2">{currentSelectionName}</span>
                <ChevronsUpDown size={16} className="text-albor-dark-gray flex-shrink-0" />
              </button>
              {isDropdownOpen && runningScenarios.length > 0 && (
                <div className="absolute top-full right-0 mt-1 w-60 bg-albor-bg-dark border border-albor-dark-gray rounded shadow-lg py-1 z-50">
                  {runningScenarios.map(scenario => ( <button key={scenario.id} onClick={() => handleScenarioSelect(scenario.id)} className={`flex items-center justify-between w-full px-3 py-1.5 text-left text-xs transition-colors ${ selectedMonitorScenarioId === scenario.id ? 'bg-albor-orange/20 text-albor-orange' : 'text-albor-light-gray hover:bg-albor-bg-dark/70' }`} > <span className="truncate">{scenario.name}</span> {selectedMonitorScenarioId === scenario.id && <Check size={14} />} </button> ))}
                </div>
              )}
            </div>
            {/* Play/Pause Button */}
            <button onClick={() => setIsRunning(!isRunning)} disabled={!selectedMonitorScenarioId}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 ${ isRunning ? 'bg-yellow-500 hover:bg-yellow-600 text-black' : 'bg-green-500 hover:bg-green-600 text-white' }`} >
              {isRunning ? <Pause size={14} /> : <Play size={14} />}
              <span>{isRunning ? 'Pause Monitoring' : 'Resume Monitoring'}</span>
            </button>
        </div>
      </div>

      {/* Conditional Rendering for No Scenario Selected */}
      {!selectedMonitorScenarioId ? (
         <div className="flex-1 flex flex-col items-center justify-center"> <div className="text-center p-6 bg-albor-bg-dark/50 rounded-lg border border-albor-dark-gray"> <Activity size={48} className="mx-auto text-albor-orange mb-4" /> <h2 className="text-lg font-semibold text-albor-light-gray mb-2">No Active Scenario Selected</h2> <p className="text-sm text-albor-dark-gray"> {runningScenarios.length > 0 ? "Select an active scenario from the dropdown above." : "There are no active scenarios to monitor."} </p> </div> </div>
        ) : (
          /* Main Grid Area - This scrolls */
          <div className={`flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto p-1 custom-scrollbar min-h-0`}>

            {/* Spectrum Chart */}
            <div className={`lg:col-span-2`}>
              <ChartTile
                key={`spectrum-${selectedMonitorScenarioId}`} // Add key based on scenario ID
                chartId="spectrum"
                title="Spectrum Analysis"
                icon={AreaChartIcon}
                onMaximizeClick={() => handleToggleMaximize('spectrum')}
                className="min-h-[250px]" // Give it more min height
              >
                <SpectrumChart data={spectrumData} />
              </ChartTile>
            </div>

            {/* Metrics Summary Table */}
            <ChartTile
              key={`summary-${selectedMonitorScenarioId}`} // Add key
              chartId="summary"
              title="Metrics Summary"
              icon={Table}
              onMaximizeClick={() => handleToggleMaximize('summary')}
            >
              <MetricsSummaryTable data={signalHistory} />
            </ChartTile>


            {/* Signal Metric Charts */}
            {chartConfigs.map(config => (
              <ChartTile
                key={`${config.id}-${selectedMonitorScenarioId}`} // Key already includes scenario ID
                chartId={config.id}
                title={`${config.name} vs Time`}
                icon={config.icon}
                onMaximizeClick={() => handleToggleMaximize(config.id)}
              >
                <SignalChart data={signalHistory} metric={config.metric} name={config.name} color={config.color} unit={config.unit} />
              </ChartTile>
            ))}

            {/* Event Log Panel */}
            <div className="md:col-span-2 lg:col-span-3">
                 <ChartTile
                    key={`log-${selectedMonitorScenarioId}`} // Add key
                    chartId="eventlog"
                    title="Event Log"
                    icon={List}
                    onMaximizeClick={() => handleToggleMaximize('eventlog')}
                    className="min-h-[200px] max-h-[300px]" > {/* Height constraint */}
                    <EventLogPanel logs={eventLogs} />
                 </ChartTile>
            </div>
          </div>
        )
      }

      {/* Modal for Maximized Chart */}
      {maximizedChartId && maximizedChartConfig && (
          <MaximizeModal chartId={maximizedChartId} title={maximizedChartConfig.title} icon={maximizedChartConfig.icon} onClose={handleCloseMaximize} >
              {maximizedChartId === 'spectrum' && <SpectrumChart data={spectrumData} />}
              {maximizedChartId === 'summary' && <MetricsSummaryTable data={signalHistory} />}
              {maximizedChartId === 'eventlog' && <EventLogPanel logs={eventLogs} />}
              {/* Find the correct config for signal charts before rendering */}
              {maximizedChartConfig && chartConfigs.find(c => c.id === maximizedChartId) && (
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
