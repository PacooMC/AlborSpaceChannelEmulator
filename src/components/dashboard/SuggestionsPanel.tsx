import React from 'react';
import { Lightbulb, AlertTriangle, XCircle, Wrench, Info, ExternalLink } from 'lucide-react';
import { Suggestion, SuggestionType, dummySuggestions } from '../../content/suggestionsData'; // Import data and types

// Map suggestion types to icons and colors
const suggestionMeta: { [key in SuggestionType]: { icon: React.ElementType; color: string; border: string } } = {
    info: { icon: Info, color: 'text-blue-400', border: 'border-blue-500/30' },
    warning: { icon: AlertTriangle, color: 'text-yellow-400', border: 'border-yellow-500/30' },
    error: { icon: XCircle, color: 'text-red-400', border: 'border-red-500/30' },
    optimization: { icon: Wrench, color: 'text-purple-400', border: 'border-purple-500/30' },
    tip: { icon: Lightbulb, color: 'text-green-400', border: 'border-green-500/30' },
};

interface SuggestionItemProps {
    suggestion: Suggestion;
    onActionClick?: (link: string | undefined, scenarioId?: string) => void; // Callback for action button
}

const SuggestionItem: React.FC<SuggestionItemProps> = ({ suggestion, onActionClick }) => {
    const meta = suggestionMeta[suggestion.type];
    const Icon = meta.icon;

    const handleAction = () => {
        if (onActionClick) {
            onActionClick(suggestion.actionLink, suggestion.relatedScenarioId);
        } else {
            console.warn("Action clicked but no handler provided:", suggestion);
        }
    };

    return (
        <div className={`p-3 rounded border ${meta.border} bg-albor-deep-space/30 flex flex-col`}>
            <div className="flex items-start space-x-2 mb-1">
                <Icon size={16} className={`${meta.color} flex-shrink-0 mt-0.5`} />
                <h4 className={`text-xs font-semibold ${meta.color} flex-1`}>{suggestion.title}</h4>
            </div>
            <p className="text-xs text-albor-light-gray/90 mb-2 flex-1">{suggestion.description}</p>
            {suggestion.actionLabel && (
                <button
                    onClick={handleAction}
                    className="mt-auto text-xs self-start flex items-center space-x-1 px-2 py-0.5 rounded bg-albor-bg-dark hover:bg-albor-orange/20 text-albor-light-gray hover:text-albor-orange transition-colors"
                >
                    <span>{suggestion.actionLabel}</span>
                    <ExternalLink size={12} />
                </button>
            )}
        </div>
    );
};


interface SuggestionsPanelProps {
    scenarioId?: string | null; // Filter suggestions based on view (global/specific)
}

const SuggestionsPanel: React.FC<SuggestionsPanelProps> = ({ scenarioId }) => {
    // Filter suggestions: Show all for global, or specific + global for scenario view
    const suggestions = dummySuggestions.filter(sug =>
        scenarioId === null || // Show all in global view
        sug.relatedScenarioId === undefined || // Show global suggestions in scenario view
        sug.relatedScenarioId === scenarioId // Show suggestions for the current scenario
    );

     // Placeholder action handler
     const handleSuggestionAction = (link: string | undefined, relatedScenarioId?: string) => {
        console.log("Suggestion Action:", { link, relatedScenarioId });
        // TODO: Implement navigation or specific actions based on link/scenarioId
        alert(`Action triggered for: ${link || 'No Link'} (Scenario: ${relatedScenarioId || 'Global'})`);
    };

    return (
        <div className="bg-albor-bg-dark/80 backdrop-blur-sm p-4 rounded border border-albor-bg-dark/50 flex flex-col min-h-[200px] h-full"> {/* Ensure full height */}
            <h3 className="text-sm font-semibold text-albor-light-gray mb-3 flex-shrink-0">System Insights & Suggestions</h3>
            <div className="flex-1 overflow-y-auto -mr-2 pr-2 space-y-3 custom-scrollbar"> {/* Allow scrolling */}
                {suggestions.length > 0 ? (
                    suggestions.map(s => (
                        <SuggestionItem
                            key={s.id}
                            suggestion={s}
                            onActionClick={handleSuggestionAction}
                        />
                    ))
                ) : (
                    <p className="text-xs text-albor-dark-gray italic text-center py-6">No specific suggestions at this time.</p>
                )}
            </div>
        </div>
    );
};

export default SuggestionsPanel;
