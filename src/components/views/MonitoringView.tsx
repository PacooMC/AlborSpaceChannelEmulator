import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
    import {
      LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area
    } from 'recharts';
    import {
        SignalMetrics, SpectrumDataPoint, LogEntry, LogLevel,
        generateSignalMetrics, generateSpectrumData, generateInitialSignalHistory,
        generateLogEntry, generateInitialLogs
    } from '../../content/monitoringData'; // Fixed: Added space before path
    import {
        Play, Pause, Settings, Maximize, Minimize, Table, Activity, AlertTriangle,
        ChevronDown, Check, ChevronsUpDown, AreaChart as AreaChartIcon, LineChart as LineChartIcon,
        List, Info, AlertCircle, WifiOff, X as CloseIcon,
        Square, Map, Server, TrendingUp, Trash2 // Added Trash2 for clear logs
    } from 'lucide-react';
    import type { Scenario, ScenarioStatus } from '../../content/scenarios';
    import { getSystemSummary, SystemSummaryStats } from '../../content/systemSummary'; // Import summary data fetcher

    // --- Import scenario-specific components ---
    import SystemSummaryTile from '../dashboard/SystemSummaryTile';
    import OrbitMapTile from '../dashboard/OrbitMapTile';
    import PortAssignmentMap from '../dashboard/PortAssignmentTile';
    import ConfirmationModal, { ConfirmationModalProps } from '../common/ConfirmationModal'; // Import the modal


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

    // Event Log Panel Component - Define Props Interface
    interface EventLogPanelProps {
        logs: LogEntry[];
        onClearLogs?: () => void; // Make optional as it's passed down
    }
    const EventLogPanel: React.FC<EventLogPanelProps> = ({ logs, onClearLogs }) => {
        const logEndRef = useRef<HTMLDivElement>(null);
        const levelInfo: { [key in LogLevel]: { icon: React.ElementType; color: string } } = {
            info: { icon: Info, color: 'text-blue-400' },
            warn: { icon: AlertTriangle, color: 'text-yellow-400' },
            error: { icon: AlertCircle, color: 'text-red-400' },
            debug: { icon: WifiOff, color: 'text-gray-500' },
        };

        useEffect(() => {
            logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, [logs]); // Scroll when logs change

        return (
            <div className="h-full w-full flex flex-col overflow-hidden p-1">
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-1">
                    {logs.map(log => {
                        const InfoIcon = levelInfo[log.level].icon;
                        const color = levelInfo[log.level].color;
                        return (
                            <div key={log.id} className="flex items-start space-x-1.5 text-xs animate-fade-in-short">
                                <InfoIcon size={12} className={`${color} flex-shrink-0 mt-0.5`} />
                                <span className="text-albor-dark-gray font-mono">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                <span className={`font-medium ${color} uppercase text-[10px] flex-shrink-0`}>[{log.level}]</span>
                                {log.source && <span className="text-purple-400 flex-shrink-0">[{log.source}]</span>}
                                <span className="text-albor-light-gray break-words flex-1">{log.message}</span>
                            </div>
                        );
                    })}
                    <div ref={logEndRef} /> {/* Invisible element to scroll to */}
                </div>
                {logs.length === 0 && (
                    <p className="text-xs text-albor-dark-gray italic text-center py-4">No log entries yet.</p>
                )}
            </div>
        );
    };


    // --- Main Monitoring View Component ---

    interface MonitoringViewProps {
      scenarioIdToMonitor: string | null; // ID of the scenario to monitor
      allRunningScenarios: Scenario[]; // List of all running/paused scenarios for dropdown
      onPauseScenario: (id: string) => void;
      onResumeScenario: (id: string) => void;
      onStopScenario: (id: string) => void;
    }

    // --- NEW: Type for confirmation state ---
    type ConfirmationState = Omit<ConfirmationModalProps, 'isOpen' | 'onConfirm' | 'onCancel'> & {
        onConfirmCallback: () => void;
    } | null;

    const MonitoringView: React.FC<MonitoringViewProps> = ({
      scenarioIdToMonitor: initialScenarioId,
      allRunningScenarios,
      onPauseScenario,
      onResumeScenario,
      onStopScenario,
    }) => {
      const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);
      const [signalHistory, setSignalHistory] = useState<SignalMetrics[]>([]);
      const [spectrumData, setSpectrumData] = useState<SpectrumDataPoint[]>([]);
      const [eventLogs, setEventLogs] = useState<LogEntry[]>([]);
      const [maximizedChart, setMaximizedChart] = useState<string | null>(null);
      const [isDropdownOpen, setIsDropdownOpen] = useState(false);
      const dropdownRef = useRef<HTMLDivElement>(null);
      const [confirmationState, setConfirmationState] = useState<ConfirmationState>(null); // State for modal

      // --- Confirmation Modal Logic ---
      const requestConfirmation = (details: Omit<ConfirmationState, 'onConfirmCallback'> & { onConfirmCallback: () => void }) => {
        setConfirmationState(details);
      };

      const handleConfirm = () => {
        if (confirmationState) {
          confirmationState.onConfirmCallback();
        }
        setConfirmationState(null);
      };

      const handleCancel = () => {
        setConfirmationState(null);
      };
      // --- End Confirmation Modal Logic ---

      // Determine the scenario to display
      useEffect(() => {
        // If an initial ID is provided, use it.
        // Otherwise, if there are running scenarios, pick the first one.
        // Otherwise, set to null.
        if (initialScenarioId) {
            setSelectedScenarioId(initialScenarioId);
        } else if (allRunningScenarios.length > 0) {
            // Prefer running over paused if available
            const running = allRunningScenarios.find(s => s.status === 'running');
            setSelectedScenarioId(running ? running.id : allRunningScenarios[0].id);
        } else {
            setSelectedScenarioId(null);
        }
      }, [initialScenarioId, allRunningScenarios]);


      // Reset data and generate initial state when scenario changes
      useEffect(() => {
        if (selectedScenarioId) {
          console.log(`MonitoringView: Initializing data for scenario ${selectedScenarioId}`);
          setSignalHistory(generateInitialSignalHistory(selectedScenarioId));
          setSpectrumData(generateSpectrumData(selectedScenarioId));
          setEventLogs(generateInitialLogs(selectedScenarioId));
        } else {
          console.log("MonitoringView: No scenario selected, clearing data.");
          setSignalHistory([]);
          setSpectrumData([]);
          setEventLogs([]);
        }
        // Reset maximized view when scenario changes
        setMaximizedChart(null);
      }, [selectedScenarioId]);

      // Data update interval
      useEffect(() => {
        if (!selectedScenarioId) return; // Don't run interval if no scenario selected

        const intervalId = setInterval(() => {
          setSignalHistory(prev => [...prev.slice(-99), generateSignalMetrics(selectedScenarioId, prev[prev.length - 1])]);
          setSpectrumData(generateSpectrumData(selectedScenarioId)); // Regenerate spectrum periodically

          // Potentially add a new log entry
          const newLog = generateLogEntry(selectedScenarioId);
          if (newLog) {
              setEventLogs(prev => [...prev.slice(-199), newLog]); // Keep last 200 logs
          }

        }, 1000); // Update every second

        return () => clearInterval(intervalId);
      }, [selectedScenarioId]); // Rerun effect if selectedScenarioId changes

      // Close dropdown when clicking outside
      useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
          if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
            setIsDropdownOpen(false);
          }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
      }, []);

      const handleMaximizeClick = (chartId: string) => {
        setMaximizedChart(chartId);
      };

      const handleMinimizeClick = () => {
        setMaximizedChart(null);
      };

      const handleScenarioSelect = (id: string) => {
        setSelectedScenarioId(id);
        setIsDropdownOpen(false);
      };

      // --- NEW: Clear Logs Function ---
      const handleClearLogs = useCallback(() => {
        requestConfirmation({
            title: "Clear Event Logs?",
            message: "Are you sure you want to clear all current log entries for this scenario?",
            confirmText: "Clear Logs",
            confirmButtonVariant: 'danger',
            onConfirmCallback: () => {
                setEventLogs([]);
                console.log(`Logs cleared for scenario: ${selectedScenarioId}`);
            },
        });
      }, [selectedScenarioId]); // Dependency on selectedScenarioId to log correctly

      const selectedScenario = useMemo(() => allRunningScenarios.find(s => s.id === selectedScenarioId), [selectedScenarioId, allRunningScenarios]);
      const scenarioStatus: ScenarioStatus = selectedScenario?.status ?? 'stopped';

      // --- Render Logic ---

      const renderMaximizedView = () => {
        if (!maximizedChart) return null;

        const chartComponents: { [key: string]: React.ReactNode } = {
          snr: <SignalChart data={signalHistory} metric="snr" name="SNR" color="#F97316" unit="dB" />,
          delay: <SignalChart data={signalHistory} metric="delay" name="Delay" color="#3B82F6" unit="ms" />,
          power: <SignalChart data={signalHistory} metric="receivedPower" name="Rx Power" color="#10B981" unit="dBm" />,
          doppler: <SignalChart data={signalHistory} metric="doppler" name="Doppler" color="#A855F7" unit="Hz" />,
          elevation: <SignalChart data={signalHistory} metric="elevation" name="Elevation" color="#EC4899" unit="°" />, // Added Elevation
          spectrum: <SpectrumChart data={spectrumData} />,
          metrics: <MetricsSummaryTable data={signalHistory} />,
          eventlog: <EventLogPanel logs={eventLogs} onClearLogs={handleClearLogs} />, // Pass clear handler
          orbitmap: <OrbitMapTile scenarioId={selectedScenarioId} isMaximized={true} />, // Pass scenarioId and maximized flag
          // *** UPDATED: Use 'map' mode when maximized ***
          portmap: <PortAssignmentMap scenarioId={selectedScenarioId} displayMode="map" />,
          summary: <SystemSummaryTile viewMode="scenario" scenarioId={selectedScenarioId} scenario={selectedScenario} />, // Pass scenario details
        };

        const chartTitles: { [key: string]: string } = {
          snr: "SNR", delay: "Delay", power: "Received Power", doppler: "Doppler", elevation: "Elevation",
          spectrum: "Spectrum Analysis", metrics: "Metrics Summary", eventlog: "Event Log",
          orbitmap: "Scenario Orbit Map", portmap: "Port Assignments", summary: "Scenario Summary"
        };

        return (
          <div className="fixed inset-0 z-40 bg-albor-deep-space/95 backdrop-blur-md p-4 flex flex-col animate-fade-in">
            <div className="flex justify-between items-center mb-2 flex-shrink-0">
              <h2 className="text-lg font-semibold text-albor-light-gray">{chartTitles[maximizedChart]} (Maximized)</h2>
              <button
                onClick={handleMinimizeClick}
                className="p-2 rounded-full text-albor-light-gray bg-albor-bg-dark/50 hover:bg-albor-orange/80 transition-colors"
                title="Minimize"
              >
                <Minimize size={18} />
              </button>
            </div>
            <div className="flex-1 bg-albor-bg-dark/50 rounded border border-albor-bg-dark/50 overflow-hidden">
              {chartComponents[maximizedChart]}
            </div>
          </div>
        );
      };

      const renderDashboardView = () => (
        // *** UPDATED GRID LAYOUT ***
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-y-auto p-1 custom-scrollbar">
          {/* Row 1: Signal Metrics */}
          <ChartTile chartId="snr" title="SNR" icon={TrendingUp} onMaximizeClick={() => handleMaximizeClick('snr')} className="min-h-[180px]">
            <SignalChart data={signalHistory} metric="snr" name="SNR" color="#F97316" unit="dB" />
          </ChartTile>
          <ChartTile chartId="delay" title="Delay" icon={Square} onMaximizeClick={() => handleMaximizeClick('delay')} className="min-h-[180px]">
            <SignalChart data={signalHistory} metric="delay" name="Delay" color="#3B82F6" unit="ms" />
          </ChartTile>
          <ChartTile chartId="power" title="Received Power" icon={Square} onMaximizeClick={() => handleMaximizeClick('power')} className="min-h-[180px]">
            <SignalChart data={signalHistory} metric="receivedPower" name="Rx Power" color="#10B981" unit="dBm" />
          </ChartTile>
          <ChartTile chartId="doppler" title="Doppler" icon={Square} onMaximizeClick={() => handleMaximizeClick('doppler')} className="min-h-[180px]">
            <SignalChart data={signalHistory} metric="doppler" name="Doppler" color="#A855F7" unit="Hz" />
          </ChartTile>

          {/* Row 2: Elevation, Spectrum, Metrics, Port Assignment */}
          <ChartTile chartId="elevation" title="Elevation" icon={Square} onMaximizeClick={() => handleMaximizeClick('elevation')} className="min-h-[180px]">
            <SignalChart data={signalHistory} metric="elevation" name="Elevation" color="#EC4899" unit="°" />
          </ChartTile>
          <ChartTile chartId="spectrum" title="Spectrum Analysis" icon={AreaChartIcon} onMaximizeClick={() => handleMaximizeClick('spectrum')} className="min-h-[180px]">
            <SpectrumChart data={spectrumData} />
          </ChartTile>
          <ChartTile chartId="metrics" title="Metrics Summary" icon={Table} onMaximizeClick={() => handleMaximizeClick('metrics')} className="min-h-[180px]">
            <MetricsSummaryTable data={signalHistory} />
          </ChartTile>
          {/* *** UPDATED: Port Assignment uses 'list' mode here *** */}
          <ChartTile chartId="portmap" title="Port Assignments" icon={Server} onMaximizeClick={() => handleMaximizeClick('portmap')} className="min-h-[180px]">
            <PortAssignmentMap scenarioId={selectedScenarioId} displayMode="list" />
          </ChartTile>

          {/* Row 3: Scenario Details, Orbit Map, Event Log (Larger) */}
          {/* *** UPDATED: Order changed *** */}
          <div className="min-h-[250px]">
            <SystemSummaryTile viewMode="scenario" scenarioId={selectedScenarioId} scenario={selectedScenario} />
          </div>
          <div className="min-h-[250px]">
            <OrbitMapTile scenarioId={selectedScenarioId} />
          </div>
          <ChartTile chartId="eventlog" title="Event Log" icon={List} onMaximizeClick={() => handleMaximizeClick('eventlog')} className="min-h-[250px] lg:col-span-2" logCount={eventLogs.length} onClearLogs={handleClearLogs}>
            <EventLogPanel logs={eventLogs} />
          </ChartTile>
        </div>
      );

      if (!selectedScenarioId) {
          return (
              <div className="flex flex-col h-full items-center justify-center text-center p-6">
                  <AlertTriangle size={48} className="text-albor-dark-gray mb-4" />
                  <h2 className="text-lg font-semibold text-albor-light-gray mb-2">No Active Scenario Selected</h2>
                  <p className="text-sm text-albor-dark-gray">
                      Please start a scenario from the 'Scenarios' view or select an active one if available.
                  </p>
              </div>
          );
      }

      return (
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex justify-between items-center mb-3 pb-2 border-b border-albor-bg-dark/50 flex-shrink-0 px-1">
            <div className="flex items-center space-x-3">
              <Activity size={18} className="text-albor-orange" />
              <h1 className="text-lg font-semibold text-albor-light-gray">Scenario Monitoring</h1>
              {/* Scenario Selector Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center space-x-1.5 px-3 py-1 rounded bg-albor-bg-dark hover:bg-albor-bg-dark/70 border border-albor-dark-gray text-albor-light-gray text-sm transition-colors"
                >
                  <span className="truncate max-w-[200px]">{selectedScenario?.name ?? "Select Scenario"}</span>
                  <ChevronsUpDown size={14} className="text-albor-dark-gray" />
                </button>
                {isDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 w-60 bg-albor-bg-dark border border-albor-dark-gray rounded shadow-lg py-1 z-50 monitoring-header-dropdown">
                    {allRunningScenarios.length > 0 ? (
                      allRunningScenarios.map(scenario => (
                        <button
                          key={scenario.id}
                          onClick={() => handleScenarioSelect(scenario.id)}
                          className={`flex items-center justify-between w-full px-3 py-1.5 text-left text-xs transition-colors ${selectedScenarioId === scenario.id ? 'bg-albor-orange/20 text-albor-orange' : 'text-albor-light-gray hover:bg-albor-bg-dark/60'}`}
                        >
                          <span className="truncate">{scenario.name}</span>
                          {selectedScenarioId === scenario.id && <Check size={14} />}
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-xs text-albor-dark-gray italic">No active scenarios</div>
                    )}
                  </div>
                )}
              </div>
            </div>
            {/* Scenario Control Buttons */}
            <div className="flex items-center space-x-2">
              {scenarioStatus === 'running' && (
                <button onClick={() => onPauseScenario(selectedScenarioId)} className="flex items-center space-x-1 px-2 py-1 rounded text-xs bg-yellow-600 hover:bg-yellow-700 text-white transition-colors">
                  <Pause size={14} /> <span>Pause</span>
                </button>
              )}
              {scenarioStatus === 'paused' && (
                <button onClick={() => onResumeScenario(selectedScenarioId)} className="flex items-center space-x-1 px-2 py-1 rounded text-xs bg-green-600 hover:bg-green-700 text-white transition-colors">
                  <Play size={14} /> <span>Resume</span>
                </button>
              )}
              {(scenarioStatus === 'running' || scenarioStatus === 'paused') && (
                <button onClick={() => onStopScenario(selectedScenarioId)} className="flex items-center space-x-1 px-2 py-1 rounded text-xs bg-red-600 hover:bg-red-700 text-white transition-colors">
                  <Square size={14} /> <span>Stop</span>
                </button>
              )}
              {/* Settings Button (Placeholder) */}
              <button className="p-1.5 rounded text-albor-dark-gray hover:text-albor-light-gray hover:bg-albor-bg-dark/50 transition-colors" title="Scenario Settings">
                <Settings size={16} />
              </button>
            </div>
          </div>

          {/* Main Content Area */}
          {maximizedChart ? renderMaximizedView() : renderDashboardView()}

          {/* Render the Confirmation Modal */}
          <ConfirmationModal
            isOpen={confirmationState !== null}
            title={confirmationState?.title || "Confirm Action"}
            message={confirmationState?.message || "Are you sure?"}
            confirmText={confirmationState?.confirmText}
            cancelText={confirmationState?.cancelText}
            confirmButtonVariant={confirmationState?.confirmButtonVariant}
            confirmButtonVariant={confirmationState?.confirmButtonVariant}
            icon={confirmationState?.icon}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
          /> {/* Add the closing tag here */}
        </div>
      );
    };

    export default MonitoringView;
