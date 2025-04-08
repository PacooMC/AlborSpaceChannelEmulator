import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import {
    SignalMetrics, SpectrumDataPoint, LogEntry, LogLevel,
    generateSignalMetrics, generateSpectrumData, generateInitialSignalHistory,
    generateLogEntry, generateInitialLogs // Import log functions
} from '../../content/monitoringData';
import {
    Play, Pause, Settings, Maximize, Minimize, Table, Activity, AlertTriangle,
    ChevronDown, Check, ChevronsUpDown, AreaChart as AreaChartIcon, LineChart as LineChartIcon,
    List, Info, AlertCircle, WifiOff // Import log level icons
} from 'lucide-react';
import type { Scenario } from '../../content/scenarios';

// --- Helper Hook for Resize Observer ---
function useResizeObserver<T extends HTMLElement>(
  callback: (entry: ResizeObserverEntry) => void,
  elementRef: React.RefObject<T>
) {
  useEffect(() => {
    if (!elementRef.current) return;
    const observer = new ResizeObserver(entries => {
      if (entries[0]) callback(entries[0]);
    });
    observer.observe(elementRef.current);
    return () => {
      const currentElement = elementRef.current;
      if (currentElement) observer.unobserve(currentElement);
      observer.disconnect();
    };
  }, [callback, elementRef]);
}


// --- Child Components ---

// Chart Tile Wrapper - Added Icon Prop
interface ChartTileProps {
  chartId: string;
  title: string;
  icon?: React.ElementType; // Optional icon component
  children: (containerRef: React.RefObject<HTMLDivElement>) => React.ReactNode;
  isMaximized: boolean;
  isHidden: boolean;
  onToggleMaximize: () => void;
}
const ChartTile: React.FC<ChartTileProps> = ({ chartId, title, icon: Icon, children, isMaximized, isHidden, onToggleMaximize }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    return (
      <div className={`
        bg-albor-bg-dark/80 backdrop-blur-sm rounded border border-albor-bg-dark/50
        flex flex-col transition-all duration-300 ease-in-out overflow-hidden
        ${isMaximized ? 'fixed inset-4 z-50 p-4' : 'relative p-2'}
        ${isHidden ? 'hidden' : ''}
        chart-tile-bg // Added class for subtle background
      `}>
        <div className="flex justify-between items-center mb-1 flex-shrink-0 px-1">
          <div className="flex items-center space-x-1.5">
             {Icon && <Icon size={12} className="text-albor-dark-gray" />}
             <h3 className="text-xs font-semibold text-albor-light-gray">{title}</h3>
          </div>
          <button
            onClick={onToggleMaximize}
            className="p-1 rounded text-albor-dark-gray hover:text-albor-light-gray hover:bg-albor-bg-dark/50 transition-colors"
            title={isMaximized ? "Minimize" : "Maximize"}
          >
            {isMaximized ? <Minimize size={12} /> : <Maximize size={12} />}
          </button>
        </div>
        <div ref={containerRef} className="flex-1 min-h-[200px] w-full h-full relative">
          {children(containerRef)}
        </div>
      </div>
    );
};


// Signal Chart Component
interface SignalChartProps {
  data: SignalMetrics[];
  metric: keyof SignalMetrics;
  name: string;
  color: string;
  unit: string;
  containerRef: React.RefObject<HTMLDivElement>;
}
const SignalChart: React.FC<SignalChartProps> = ({ data, metric, name, color, unit, containerRef }) => {
  const [hasMeasured, setHasMeasured] = useState(false);
  const handleResize = useCallback((entry: ResizeObserverEntry) => {
    if (!hasMeasured && entry.contentRect.width > 0 && entry.contentRect.height > 0) setHasMeasured(true);
  }, [hasMeasured]);
  useResizeObserver(handleResize, containerRef);
  useEffect(() => {
      setHasMeasured(false);
      if (containerRef.current && containerRef.current.offsetWidth > 0 && containerRef.current.offsetHeight > 0) setHasMeasured(true);
  }, [containerRef]);

  return (
    <div className="absolute inset-0">
        {hasMeasured ? (
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 5, right: 20, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-albor-dark-gray)" strokeOpacity={0.3} />
                    <XAxis dataKey="timestamp" tickFormatter={(ts) => new Date(ts).toLocaleTimeString()} stroke="var(--color-albor-dark-gray)" fontSize={10} dy={5} />
                    <YAxis stroke="var(--color-albor-dark-gray)" fontSize={10} dx={-5} domain={['auto', 'auto']} label={{ value: unit, angle: -90, position: 'insideLeft', fill: 'var(--color-albor-dark-gray)', fontSize: 10, dx: -15 }} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--color-albor-bg-dark)', border: '1px solid var(--color-albor-dark-gray)', fontSize: '12px' }} labelFormatter={(ts) => new Date(ts).toLocaleString()} formatter={(value: number) => [`${value.toFixed(2)} ${unit}`, name]} />
                    <Line type="monotone" dataKey={metric} name={name} stroke={color} strokeWidth={1.5} dot={false} isAnimationActive={false} />
                </LineChart>
            </ResponsiveContainer>
        ) : ( <div className="flex items-center justify-center h-full text-xs text-albor-dark-gray">Initializing...</div> )}
    </div>
  );
};

// Spectrum Chart Component
interface SpectrumChartProps {
  data: SpectrumDataPoint[];
  containerRef: React.RefObject<HTMLDivElement>;
}
const SpectrumChart: React.FC<SpectrumChartProps> = ({ data, containerRef }) => {
  const [hasMeasured, setHasMeasured] = useState(false);
  const handleResize = useCallback((entry: ResizeObserverEntry) => {
    if (!hasMeasured && entry.contentRect.width > 0 && entry.contentRect.height > 0) setHasMeasured(true);
  }, [hasMeasured]);
  useResizeObserver(handleResize, containerRef);
   useEffect(() => {
      setHasMeasured(false);
      if (containerRef.current && containerRef.current.offsetWidth > 0 && containerRef.current.offsetHeight > 0) setHasMeasured(true);
   }, [containerRef]);

  return (
    <div className="absolute inset-0">
        {hasMeasured ? (
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 5, right: 20, left: -20, bottom: 20 }}>
                    <defs> <linearGradient id="spectrumGradient" x1="0" y1="0" x2="0" y2="1"> <stop offset="5%" stopColor="var(--color-albor-orange)" stopOpacity={0.6}/> <stop offset="95%" stopColor="var(--color-albor-orange)" stopOpacity={0.1}/> </linearGradient> </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-albor-dark-gray)" strokeOpacity={0.3} />
                    <XAxis dataKey="frequency" type="number" domain={['dataMin', 'dataMax']} stroke="var(--color-albor-dark-gray)" fontSize={10} dy={5} tickFormatter={(freq) => `${freq.toFixed(0)}`} label={{ value: "Frequency (MHz)", position: 'insideBottom', fill: 'var(--color-albor-dark-gray)', fontSize: 10, dy: 15 }} />
                    <YAxis stroke="var(--color-albor-dark-gray)" fontSize={10} dx={-5} domain={[-100, -30]} label={{ value: "Power (dBm)", angle: -90, position: 'insideLeft', fill: 'var(--color-albor-dark-gray)', fontSize: 10, dx: -15 }} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--color-albor-bg-dark)', border: '1px solid var(--color-albor-dark-gray)', fontSize: '12px' }} labelFormatter={(freq: number) => `${freq.toFixed(2)} MHz`} formatter={(value: number) => [`${value.toFixed(1)} dBm`, "Power"]} />
                    <Area type="monotone" dataKey="power" stroke="var(--color-albor-orange)" fillOpacity={1} fill="url(#spectrumGradient)" strokeWidth={1.5} isAnimationActive={false} />
                </AreaChart>
            </ResponsiveContainer>
        ) : ( <div className="flex items-center justify-center h-full text-xs text-albor-dark-gray">Initializing...</div> )}
    </div>
  );
};

// Metrics Summary Table Component
interface MetricsSummaryTableProps {
  data: SignalMetrics[];
}
const MetricsSummaryTable: React.FC<MetricsSummaryTableProps> = ({ data }) => {
  const summary = useMemo(() => {
    if (data.length === 0) return { current: null, min: {}, max: {} };
    const current = data[data.length - 1];
    const metrics: (keyof SignalMetrics)[] = ['snr', 'delay', 'receivedPower', 'doppler'];
    const minMax = metrics.reduce((acc, key) => {
      const values = data.map(d => d[key]).filter(v => typeof v === 'number');
      if (values.length > 0) {
        acc.min[key] = Math.min(...values);
        acc.max[key] = Math.max(...values);
      }
      return acc;
    }, { min: {} as Partial<SignalMetrics>, max: {} as Partial<SignalMetrics> });
    return { current, ...minMax };
  }, [data]);

  const formatValue = (key: keyof SignalMetrics, value: number | undefined): string => {
    if (value === undefined || value === null) return 'N/A';
    switch (key) {
      case 'snr': return `${value.toFixed(1)} dB`;
      case 'delay': return `${value.toFixed(1)} ms`;
      case 'receivedPower': return `${value.toFixed(1)} dBm`;
      case 'doppler': return `${value.toFixed(0)} Hz`;
      case 'timestamp': return new Date(value).toLocaleTimeString();
      default: return String(value);
    }
  };

  const metricsToDisplay: { key: keyof SignalMetrics; name: string }[] = [
    { key: 'snr', name: 'SNR' }, { key: 'delay', name: 'Delay' },
    { key: 'receivedPower', name: 'Rx Power' }, { key: 'doppler', name: 'Doppler' },
  ];

  return (
    <div className="h-full w-full overflow-auto p-1">
      <table className="w-full text-left text-xs">
        <thead> <tr className="text-albor-dark-gray border-b border-albor-bg-dark"> <th className="py-1 px-2">Metric</th> <th className="py-1 px-2 text-right">Current</th> <th className="py-1 px-2 text-right">Min</th> <th className="py-1 px-2 text-right">Max</th> </tr> </thead>
        <tbody className="divide-y divide-albor-bg-dark/50">
          {metricsToDisplay.map(({ key, name }) => (
            <tr key={key} className="hover:bg-albor-bg-dark/30">
              <td className="py-1.5 px-2 font-medium text-albor-light-gray">{name}</td>
              <td className="py-1.5 px-2 text-right font-mono">{formatValue(key, summary.current?.[key])}</td>
              <td className="py-1.5 px-2 text-right font-mono text-albor-dark-gray">{formatValue(key, summary.min[key])}</td>
              <td className="py-1.5 px-2 text-right font-mono text-albor-dark-gray">{formatValue(key, summary.max[key])}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// --- NEW: Event Log Panel Component ---
interface EventLogPanelProps {
    logs: LogEntry[];
}
const EventLogPanel: React.FC<EventLogPanelProps> = ({ logs }) => {
    const logEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Auto-scroll to bottom when logs change
        logEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [logs]);

    const getLogLevelInfo = (level: LogLevel): { icon: React.ElementType, color: string } => {
        switch (level) {
            case 'info': return { icon: Info, color: 'text-blue-400' };
            case 'warn': return { icon: AlertTriangle, color: 'text-yellow-400' };
            case 'error': return { icon: AlertCircle, color: 'text-red-500' };
            case 'debug': return { icon: WifiOff, color: 'text-gray-500' }; // Example for debug
            default: return { icon: Info, color: 'text-gray-400' };
        }
    };

    return (
        <div className="h-full w-full flex flex-col overflow-hidden">
            <div className="overflow-y-auto flex-1 pr-1 space-y-1.5">
                {logs.map(log => {
                    const { icon: Icon, color } = getLogLevelInfo(log.level);
                    return (
                        <div key={log.id} className="flex items-start space-x-2 text-xs animate-fade-in-short">
                            <Icon size={14} className={`${color} flex-shrink-0 mt-0.5`} />
                            <div className="flex-1">
                                <span className="text-albor-dark-gray mr-2">
                                    {new Date(log.timestamp).toLocaleTimeString()}
                                </span>
                                {log.source && <span className="font-medium text-albor-light-gray/80 mr-1">[{log.source}]</span>}
                                <span className="text-albor-light-gray">{log.message}</span>
                            </div>
                        </div>
                    );
                })}
                {logs.length === 0 && (
                    <p className="text-xs text-albor-dark-gray italic text-center py-4">No log entries yet.</p>
                )}
                {/* Dummy div to ensure scrolling to bottom */}
                <div ref={logEndRef} />
            </div>
        </div>
    );
};


// --- Main View Component ---

const MAX_HISTORY = 100;
const MAX_LOGS = 50; // Limit number of logs displayed

interface MonitoringViewProps {
  runningScenarios: Scenario[];
}

const MonitoringView: React.FC<MonitoringViewProps> = ({ runningScenarios }) => {
  const [selectedMonitorScenarioId, setSelectedMonitorScenarioId] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(true);
  const [signalHistory, setSignalHistory] = useState<SignalMetrics[]>([]);
  const [spectrumData, setSpectrumData] = useState<SpectrumDataPoint[]>([]);
  const [eventLogs, setEventLogs] = useState<LogEntry[]>([]); // State for logs
  const [isMaximized, setIsMaximized] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Effect to handle default selection and scenario changes
  useEffect(() => {
    let currentSelection = selectedMonitorScenarioId;
    if (!currentSelection || !runningScenarios.some(s => s.id === currentSelection)) {
      currentSelection = runningScenarios.length > 0 ? runningScenarios[0].id : null;
    }

    if (currentSelection !== selectedMonitorScenarioId) {
      setSelectedMonitorScenarioId(currentSelection);
    }

    if (currentSelection) {
      setSignalHistory(generateInitialSignalHistory(currentSelection, MAX_HISTORY));
      setSpectrumData(generateSpectrumData(currentSelection));
      setEventLogs(generateInitialLogs(currentSelection, MAX_LOGS)); // Load initial logs
    } else {
      setSignalHistory([]);
      setSpectrumData([]);
      setEventLogs([]); // Clear logs
    }
  }, [runningScenarios, selectedMonitorScenarioId]);


  // Effect to update data periodically if running
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    if (isRunning && selectedMonitorScenarioId) {
      intervalId = setInterval(() => {
        // Update Metrics
        setSignalHistory(prev => {
          const newMetric = generateSignalMetrics(selectedMonitorScenarioId, prev[prev.length - 1]);
          const updatedHistory = [...prev, newMetric];
          return updatedHistory.slice(-MAX_HISTORY);
        });
        setSpectrumData(generateSpectrumData(selectedMonitorScenarioId));

        // Generate potential Log Entry
        const newLog = generateLogEntry(selectedMonitorScenarioId);
        if (newLog) {
            setEventLogs(prevLogs => [...prevLogs.slice(-MAX_LOGS + 1), newLog]); // Add new log, keep limit
        }

      }, 1000);
    }
    return () => { if (intervalId) clearInterval(intervalId); };
  }, [isRunning, selectedMonitorScenarioId]);

  // Close dropdown if clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  const toggleMaximize = (chartId: string) => {
    setIsMaximized(prev => (prev === chartId ? null : chartId));
  };

  const handleScenarioSelect = (id: string | null) => {
    if (id !== selectedMonitorScenarioId) setSelectedMonitorScenarioId(id);
    setIsDropdownOpen(false);
  };

  const chartConfigs = useMemo(() => [
    { id: 'snr', metric: 'snr' as keyof SignalMetrics, name: 'SNR', color: '#34D399', unit: 'dB', icon: LineChartIcon },
    { id: 'delay', metric: 'delay' as keyof SignalMetrics, name: 'Delay', color: '#60A5FA', unit: 'ms', icon: LineChartIcon },
    { id: 'power', metric: 'receivedPower' as keyof SignalMetrics, name: 'Rx Power', color: '#F87171', unit: 'dBm', icon: LineChartIcon },
    { id: 'doppler', metric: 'doppler' as keyof SignalMetrics, name: 'Doppler', color: '#FACC15', unit: 'Hz', icon: LineChartIcon },
  ], []);

  const currentSelectionName = selectedMonitorScenarioId
    ? runningScenarios.find(s => s.id === selectedMonitorScenarioId)?.name ?? 'Select Scenario...'
    : 'Select Scenario...';


  // --- Main Render Logic ---
  return (
    <div className="text-white flex flex-col h-full">
      {/* Header/Controls - Revised Layout */}
      <div className="flex justify-between items-center mb-4 pb-2 border-b border-albor-bg-dark/50 flex-shrink-0 gap-4 px-1">
        <h1 className="text-xl font-semibold text-albor-light-gray flex-shrink-0">Monitoring</h1>
        <div className="flex items-center gap-4 flex-shrink-0">
            {/* Scenario Selector Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <label htmlFor="monitor-scenario-select" className="text-xs text-albor-dark-gray absolute -top-3.5 left-0">Scenario</label>
              <button
                id="monitor-scenario-select" onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                disabled={runningScenarios.length === 0}
                className="flex items-center justify-between px-3 py-1.5 min-w-[220px] max-w-xs bg-albor-bg-dark/60 border border-albor-dark-gray/70 rounded text-sm text-albor-light-gray hover:border-albor-light-gray/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                title="Select Scenario to Monitor"
              >
                <span className="truncate mr-2">{currentSelectionName}</span>
                <ChevronsUpDown size={16} className="text-albor-dark-gray flex-shrink-0" />
              </button>
              {isDropdownOpen && runningScenarios.length > 0 && (
                <div className="absolute top-full right-0 mt-1 w-60 bg-albor-bg-dark border border-albor-dark-gray rounded shadow-lg py-1 z-50">
                  {runningScenarios.map(scenario => (
                    <button key={scenario.id} onClick={() => handleScenarioSelect(scenario.id)}
                      className={`flex items-center justify-between w-full px-3 py-1.5 text-left text-xs transition-colors ${ selectedMonitorScenarioId === scenario.id ? 'bg-albor-orange/20 text-albor-orange' : 'text-albor-light-gray hover:bg-albor-bg-dark/70' }`} >
                      <span className="truncate">{scenario.name}</span>
                      {selectedMonitorScenarioId === scenario.id && <Check size={14} />}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {/* Play/Pause Button - Updated Text */}
            <button onClick={() => setIsRunning(!isRunning)} disabled={!selectedMonitorScenarioId}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 ${ isRunning ? 'bg-yellow-500 hover:bg-yellow-600 text-black' : 'bg-green-500 hover:bg-green-600 text-white' }`} >
              {isRunning ? <Pause size={14} /> : <Play size={14} />}
              {/* Updated Text */}
              <span>{isRunning ? 'Pause Monitoring' : 'Resume Monitoring'}</span>
            </button>
        </div>
      </div>

      {/* Conditional Rendering for No Scenario Selected */}
      {!selectedMonitorScenarioId ? (
         <div className="flex-1 flex flex-col items-center justify-center">
            <div className="text-center p-6 bg-albor-bg-dark/50 rounded-lg border border-albor-dark-gray">
              <Activity size={48} className="mx-auto text-albor-orange mb-4" />
              <h2 className="text-lg font-semibold text-albor-light-gray mb-2">No Active Scenario Selected</h2>
              <p className="text-sm text-albor-dark-gray"> {runningScenarios.length > 0 ? "Select an active scenario from the dropdown above." : "There are no active scenarios to monitor."} </p>
            </div>
         </div>
        ) : (
          /* Main Grid - Render only if a scenario is selected */
          <div className={`flex-1 grid grid-cols-1 ${isMaximized ? '' : 'md:grid-cols-2 lg:grid-cols-3'} gap-4 overflow-y-auto p-1`}>

            {/* Spectrum Chart */}
            <div className={`${isMaximized ? '' : 'lg:col-span-2'}`}>
              <ChartTile chartId="spectrum" title="Spectrum Analysis" icon={AreaChartIcon}
                isMaximized={isMaximized === 'spectrum'} isHidden={isMaximized !== null && isMaximized !== 'spectrum'}
                onToggleMaximize={() => toggleMaximize('spectrum')} >
                {(ref) => <SpectrumChart data={spectrumData} containerRef={ref} />}
              </ChartTile>
            </div>

            {/* Metrics Summary Table */}
            <ChartTile chartId="summary" title="Metrics Summary" icon={Table}
              isMaximized={isMaximized === 'summary'} isHidden={isMaximized !== null && isMaximized !== 'summary'}
              onToggleMaximize={() => toggleMaximize('summary')} >
              {() => <MetricsSummaryTable data={signalHistory} />}
            </ChartTile>


            {/* Signal Metric Charts */}
            {chartConfigs.map(config => (
              <ChartTile key={`${selectedMonitorScenarioId}-${config.id}`} chartId={config.id} title={`${config.name} vs Time`} icon={config.icon}
                isMaximized={isMaximized === config.id} isHidden={isMaximized !== null && isMaximized !== config.id}
                onToggleMaximize={() => toggleMaximize(config.id)} >
                {(ref) => <SignalChart data={signalHistory} metric={config.metric} name={config.name} color={config.color} unit={config.unit} containerRef={ref} />}
              </ChartTile>
            ))}

            {/* Event Log Panel - Spans full width when not maximized */}
            {!isMaximized && (
              <div className="md:col-span-2 lg:col-span-3">
                 <ChartTile chartId="eventlog" title="Event Log" icon={List}
                    isMaximized={false} isHidden={false} // Log panel doesn't maximize
                    onToggleMaximize={() => {}} >
                    {() => <EventLogPanel logs={eventLogs} />}
                 </ChartTile>
              </div>
            )}
          </div>
        )
      }
    </div>
  );
};

export default MonitoringView;
