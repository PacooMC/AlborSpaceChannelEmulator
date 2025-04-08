# Scenario Editor Feature Roadmap

    This file tracks the proposed features and improvements for the Scenario Editor. Mark items as completed by changing `[ ]` to `[x]`.

    **I. Core Functionality & Realistic Mode:**

    - [x] 1. Realistic Mode - Orbit Definition & Calculation (TLE/Keplerian Input & Basic Params)
    - [x] 2. Realistic Mode - Ground Asset Placement (Lat/Lon/Alt Input & Map Preview)
    - [x] 3. Realistic Mode - Automatic Link Determination (Conceptual - Disable Manual Links)
    - [ ] 4. Orbit Propagation & Visualization (Ground Track / 3D View?)
    - [ ] 5. Line-of-Sight (LOS) Calculation & Link Display (Realistic Mode)
    - [ ] 6. Basic Link Budget Parameters (FSPL, Margin - Realistic Mode)
    - [ ] 7. Basic Antenna Pointing/Coverage Visualization (Realistic Mode)
    - [ ] 8. TLE Auto-Update (Integration?)

    **II. Core Editing & Usability Enhancements:**

    - [ ] 9. Multi-Select & Group Actions
    - [ ] 10. Advanced Edge Routing (Custom Mode)
    - [ ] 11. Snap-to-Grid / Alignment Tools
    - [ ] 12. Copy/Paste Nodes & Configurations
    - [ ] 13. Enhanced Configuration Panels (Validation, Units, Tooltips)
    - [ ] 14. Edge Configuration Sidebar (Custom Mode)
    - [ ] 15. Keyboard Shortcuts
    - [ ] 16. Node/Edge Search & Highlight
    - [x] 17. Minimap Enhancements (Improved Styling v2)
    - [x] 18. Global Placement Map Enhancements (Improved Styling)
    - [x] 19. Clarify Realistic vs. Custom Mode (UI Cues & Info Text)
    - [x] 20. Remove Redundant Controls (Zoom/Undo/Redo from TopBar)

    **III. Custom Mode Enhancements:**

    - [ ] 21. Advanced Channel Models Library
    - [ ] 22. Signal Impairments Configuration
    - [ ] 23. Custom Node/Edge Properties Definition

    **IV. Simulation Control & Visualization:**

    - [x] 24. Time Control Bar (Play/Pause/Scrub) - *Partially addressed by Start Sim flow*
    - [ ] 25. Live Data Display on Nodes/Edges (Dashboard/Editor Integration)
    - [ ] 26. Event Logging Panel
    - [x] 27. Scenario Activation Flow (Start Sim -> Loading -> Monitoring View)

    **V. Scenario Management & Workflow:**

    - [x] 28. Scenario Saving (Basic LocalStorage Implementation)
    - [x] 29. List Saved Scenarios (Moved to Editor Sidebar)
    - [x] 30. Scenario Loading (Basic - Trigger reload via ID change)
    - [x] 31. Scenario Search (Filter saved list by name/ID in Editor Sidebar)
    - [x] 32. Scenario Deletion (Basic LocalStorage removal + Confirmation)
    - [x] 33. Unsaved Changes Detection & Confirmation Dialog
    - [x] 34. "Save As" Functionality
    - [ ] 35. Scenario Duplication
    - [ ] 36. Scenario Templates
    - [ ] 37. Scenario Versioning
    - [ ] 38. Import/Export Scenarios (JSON, potentially others)
    - [ ] 39. Scenario Validation Checks
    - [ ] 40. Scenario Organization (Folders/Tags - Requires Backend?)

    **VI. UI/UX Refinements:**

    - [x] 41. Editor Layout Refinement (Scenario Mgmt Left, Node Creation/Config Right)
    - [x] 42. Increase Saved Scenario List Height
    - [ ] 43. Panel Layout Customization (Resize/Collapse)
    - [ ] 44. Contextual Help / Documentation Links
    - [ ] 45. Improved Error Feedback Messages
