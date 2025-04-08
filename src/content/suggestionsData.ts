import { LucideIcon } from 'lucide-react';

export type SuggestionType = 'info' | 'warning' | 'error' | 'optimization' | 'tip';

export interface Suggestion {
    id: string;
    type: SuggestionType;
    title: string;
    description: string;
    relatedScenarioId?: string; // Optional: Link suggestion to a specific scenario
    actionLabel?: string; // Optional: Text for an action button
    actionLink?: string; // Optional: Link or internal route for the action
}

// Example dummy data
export const dummySuggestions: Suggestion[] = [
    {
        id: 'sug-1',
        type: 'warning',
        title: 'Scenario Incomplete: "MEO Handover Study"',
        description: 'This scenario is paused and may require further configuration before completion.',
        relatedScenarioId: 'handover-study',
        actionLabel: 'Edit Scenario',
        actionLink: '/scenarios/handover-study', // Example internal link
    },
    {
        id: 'sug-2',
        type: 'error',
        title: 'Link Errors Detected in "LEO Constellation Test"',
        description: 'Multiple links are reporting errors. Check link configurations and signal quality.',
        relatedScenarioId: 'leo-test-1',
        actionLabel: 'View Monitoring',
        actionLink: '/monitoring/leo-test-1', // Example internal link
    },
    {
        id: 'sug-3',
        type: 'optimization',
        title: 'Optimize Port Assignments',
        description: 'Consider reassigning ports on SDR-02 for potentially better resource utilization.',
        actionLabel: 'View Ports',
        actionLink: '/dashboard', // Link to relevant dashboard section
    },
    {
        id: 'sug-4',
        type: 'info',
        title: 'New Channel Model Available',
        description: '"Advanced Multipath v2" model added. Consider using it for relevant scenarios.',
    },
    {
        id: 'sug-5',
        type: 'tip',
        title: 'Realistic Mode Tip',
        description: 'Ensure accurate TLE or Keplerian data for precise orbit propagation in Realistic scenarios.',
    },
     {
        id: 'sug-6',
        type: 'warning',
        title: 'High Resource Usage on SDR-01',
        description: 'Consider reducing the number of active links or complexity on SDR-01.',
        source: 'System Monitor', // Example source
    },
];
