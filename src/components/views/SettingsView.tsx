import React, { useState } from 'react';
import { UserCircle, Users, KeyRound, Palette, Bell, Edit3, PlusCircle, Trash2, Lock, Database, SlidersHorizontal, AlertCircle, CheckCircle, Info, Save, ShieldCheck } from 'lucide-react'; // Added ShieldCheck here

// --- Helper Components ---

const SettingsSection: React.FC<{ title: string; icon: React.ElementType; children: React.ReactNode; description?: string }> = ({ title, icon: Icon, children, description }) => (
  <div className="bg-albor-bg-dark/80 backdrop-blur-sm p-4 rounded border border-albor-bg-dark/50">
    <div className="flex items-center space-x-2 mb-1">
      <Icon className="text-albor-orange" size={18} />
      <h2 className="text-base font-semibold text-albor-light-gray">{title}</h2>
    </div>
    {description && <p className="text-xs text-albor-dark-gray mb-3">{description}</p>}
    <div className="space-y-4 text-sm border-t border-albor-dark-gray/30 pt-3">
      {children}
    </div>
  </div>
);

const ToggleSwitch: React.FC<{ label: string; description?: string; enabled: boolean; onChange: (enabled: boolean) => void }> = ({ label, description, enabled, onChange }) => (
  <div>
    <div className="flex items-center justify-between">
      <span className="text-albor-light-gray">{label}</span>
      <button
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex items-center h-5 rounded-full w-9 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-albor-bg-dark focus:ring-albor-orange ${enabled ? 'bg-albor-orange' : 'bg-albor-dark-gray'}`}
      >
        <span
          className={`inline-block w-3.5 h-3.5 transform bg-white rounded-full transition-transform duration-200 ease-in-out ${enabled ? 'translate-x-4' : 'translate-x-0.5'}`}
        />
      </button>
    </div>
    {description && <p className="text-xs text-albor-dark-gray mt-1">{description}</p>}
  </div>
);

const SettingInput: React.FC<{ label: string; id: string; value: string; onChange: (value: string) => void; type?: string; readOnly?: boolean }> = ({ label, id, value, onChange, type = "text", readOnly = false }) => (
    <div>
        <label htmlFor={id} className="block text-xs text-albor-dark-gray mb-1">{label}</label>
        <input
            type={type}
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            readOnly={readOnly}
            className={`w-full bg-albor-deep-space/50 border rounded px-2 py-1 text-xs placeholder-albor-dark-gray focus:outline-none focus:ring-1 focus:ring-albor-orange ${readOnly ? 'text-albor-dark-gray cursor-not-allowed' : 'text-albor-light-gray border-albor-bg-dark'}`}
        />
    </div>
);

const AccentColorSelector: React.FC<{ selectedColor: string; onChange: (color: string) => void }> = ({ selectedColor, onChange }) => {
    const colors = ['#F97316', '#3B82F6', '#10B981', '#A855F7']; // Orange, Blue, Emerald, Purple
    return (
        <div>
            <span className="block text-xs text-albor-dark-gray mb-1">Accent Color</span>
            <div className="flex space-x-2">
                {colors.map(color => (
                    <button
                        key={color}
                        onClick={() => onChange(color)}
                        className={`w-6 h-6 rounded-full border-2 transition-all ${selectedColor === color ? 'border-white ring-2 ring-offset-1 ring-offset-albor-bg-dark ring-white' : 'border-transparent hover:border-albor-light-gray'}`}
                        style={{ backgroundColor: color }}
                        title={`Set accent to ${color}`}
                    />
                ))}
            </div>
        </div>
    );
};


const SettingsView: React.FC = () => {
  // Placeholder states
  const [userName, setUserName] = useState("Operator User");
  const userEmail = "operator@albor.example"; // Typically read-only
  const [darkMode, setDarkMode] = useState(true);
  const [accentColor, setAccentColor] = useState('#F97316'); // Default Orange
  const [notifyCritical, setNotifyCritical] = useState(true);
  const [notifyUpdates, setNotifyUpdates] = useState(false);
  const [defaultScenarioType, setDefaultScenarioType] = useState<'realistic' | 'custom'>('realistic');

  const handleAction = (action: string, data?: any) => {
    console.log(`Settings Action: ${action}`, data || '');
    alert(`Simulating action: ${action}`);
  };

  return (
    <div className="text-white">
      <h1 className="text-xl font-semibold mb-4 pb-2 border-b border-albor-bg-dark/50">Settings</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Profile Section */}
        <SettingsSection title="User Profile" icon={UserCircle}>
          <SettingInput label="Display Name" id="userName" value={userName} onChange={setUserName} />
          <SettingInput label="Email Address" id="userEmail" value={userEmail} onChange={() => {}} readOnly={true} />
          <button onClick={() => handleAction('change_password')} className="w-full text-left flex items-center space-x-1 px-2 py-1 rounded text-xs bg-albor-bg-dark hover:bg-albor-bg-dark/70 text-albor-light-gray transition-colors border border-albor-dark-gray">
            <Lock size={12} />
            <span>Change Password...</span>
          </button>
        </SettingsSection>

        {/* Security Section */}
        <SettingsSection title="Security & API" icon={Lock} description="Manage access keys and security settings.">
           {/* API Keys */}
           <div>
                <h3 className="text-sm font-medium text-albor-light-gray mb-2">API Keys</h3>
                <div className="space-y-2 max-h-24 overflow-y-auto custom-scrollbar pr-2 mb-2">
                    {/* Placeholder API Keys */}
                    <div className="flex items-center justify-between bg-albor-deep-space/50 p-1.5 rounded border border-albor-bg-dark">
                    <span className="font-mono text-xs text-albor-light-gray truncate">prod_sk_abc...xyz</span>
                    <button onClick={() => handleAction('delete_api_key', 'prod_sk_abc...xyz')} className="text-red-500 hover:text-red-400 ml-2 flex-shrink-0 p-0.5"><Trash2 size={14} /></button>
                    </div>
                    <div className="flex items-center justify-between bg-albor-deep-space/50 p-1.5 rounded border border-albor-bg-dark">
                    <span className="font-mono text-xs text-albor-light-gray truncate">dev_sk_123...789</span>
                    <button onClick={() => handleAction('delete_api_key', 'dev_sk_123...789')} className="text-red-500 hover:text-red-400 ml-2 flex-shrink-0 p-0.5"><Trash2 size={14} /></button>
                    </div>
                </div>
                <button onClick={() => handleAction('generate_api_key')} className="w-full flex items-center justify-center space-x-1 px-2 py-1 rounded text-xs bg-blue-600 hover:bg-blue-700 text-white transition-colors">
                    <PlusCircle size={14} />
                    <span>Generate New Key</span>
                </button>
           </div>
           {/* 2FA Placeholder */}
           <div>
                <h3 className="text-sm font-medium text-albor-light-gray mb-2">Two-Factor Authentication (2FA)</h3>
                <button onClick={() => handleAction('setup_2fa')} className="w-full text-left flex items-center space-x-1 px-2 py-1 rounded text-xs bg-albor-bg-dark hover:bg-albor-bg-dark/70 text-albor-light-gray transition-colors border border-albor-dark-gray">
                    <ShieldCheck size={12} /> {/* Icon was used here */}
                    <span>Setup 2FA...</span>
                </button>
           </div>
        </SettingsSection>

        {/* Appearance Section */}
        <SettingsSection title="Appearance" icon={Palette} description="Customize the look and feel.">
           <ToggleSwitch label="Dark Mode" enabled={darkMode} onChange={setDarkMode} description="Enable dark interface theme." />
           <AccentColorSelector selectedColor={accentColor} onChange={setAccentColor} />
        </SettingsSection>

        {/* Notifications Section */}
        <SettingsSection title="Notifications" icon={Bell} description="Configure how you receive alerts and updates.">
           <ToggleSwitch label="Critical System Alerts" enabled={notifyCritical} onChange={setNotifyCritical} description="Receive notifications for critical hardware or software issues." />
           <ToggleSwitch label="Software Update Available" enabled={notifyUpdates} onChange={setNotifyUpdates} description="Get notified when new software versions are released." />
           <button onClick={() => handleAction('configure_notifications')} className="w-full text-left flex items-center space-x-1 px-2 py-1 rounded text-xs bg-albor-bg-dark hover:bg-albor-bg-dark/70 text-albor-light-gray transition-colors border border-albor-dark-gray">
                <SlidersHorizontal size={12} />
                <span>Advanced Notification Settings...</span>
            </button>
        </SettingsSection>

        {/* Data & Simulation Section */}
        <SettingsSection title="Data & Simulation" icon={Database} description="Manage scenario data and default behaviors.">
            <div>
                <label htmlFor="defaultScenarioType" className="block text-xs text-albor-dark-gray mb-1">Default New Scenario Type</label>
                <select
                    id="defaultScenarioType"
                    value={defaultScenarioType}
                    onChange={(e) => setDefaultScenarioType(e.target.value as 'realistic' | 'custom')}
                    className="w-full bg-albor-deep-space/50 border border-albor-bg-dark rounded px-2 py-1 text-xs text-albor-light-gray focus:outline-none focus:ring-1 focus:ring-albor-orange"
                >
                    <option value="realistic">Realistic</option>
                    <option value="custom">Custom</option>
                </select>
            </div>
            <SettingInput label="Scenario Storage Location" id="storagePath" value="/data/scenarios/" onChange={() => {}} readOnly={true} />
            <div className="flex space-x-2">
                <button onClick={() => handleAction('clear_cache')} className="flex-1 flex items-center justify-center space-x-1 px-2 py-1 rounded text-xs bg-albor-bg-dark hover:bg-albor-bg-dark/70 text-albor-light-gray transition-colors border border-albor-dark-gray">
                    <span>Clear Cache</span>
                </button>
                <button onClick={() => handleAction('manage_import_export')} className="flex-1 flex items-center justify-center space-x-1 px-2 py-1 rounded text-xs bg-albor-bg-dark hover:bg-albor-bg-dark/70 text-albor-light-gray transition-colors border border-albor-dark-gray">
                    <span>Import/Export...</span>
                </button>
            </div>
        </SettingsSection>

        {/* Save Button (Optional - could auto-save) */}
        <div className="md:col-span-2 flex justify-end mt-4">
             <button onClick={() => handleAction('save_settings')} className="flex items-center space-x-1.5 px-4 py-1.5 rounded text-sm bg-albor-orange hover:bg-albor-orange/80 text-white font-semibold transition-colors">
                <Save size={16} />
                <span>Save Settings</span>
            </button>
        </div>

      </div>
    </div>
  );
};

export default SettingsView;
