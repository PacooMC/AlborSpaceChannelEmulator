// Patch to fix d3-selection version conflicts causing errors in ReactFlow (v10+)
// See: https://github.com/xyflow/xyflow/issues/1979#issuecomment-1982482081
// This manually adds the .interrupt() and .transition() methods expected by d3-zoom v3
// to the d3-selection prototype if they are missing.

// Use namespace import for d3-selection
import * as d3Selection from 'd3-selection';

// Import directly from d3-transition
let interrupt, transition;
try {
  // d3-transition extends the d3Selection.selection prototype upon import
  await import('d3-transition');

  // Check if the methods now exist on the prototype
  if (typeof d3Selection.selection.prototype.interrupt === 'function') {
    interrupt = d3Selection.selection.prototype.interrupt;
     console.log("d3-patch: Found .interrupt() on d3-selection prototype.");
  } else {
     console.warn("d3-patch: .interrupt() not found on d3-selection prototype after importing d3-transition.");
     interrupt = null; // Mark as not found
  }

  if (typeof d3Selection.selection.prototype.transition === 'function') {
    transition = d3Selection.selection.prototype.transition;
    console.log("d3-patch: Found .transition() on d3-selection prototype.");
  } else {
     console.warn("d3-patch: .transition() not found on d3-selection prototype after importing d3-transition.");
     transition = null; // Mark as not found
  }

} catch (e) {
  console.error("d3-patch: Failed to import d3-transition or access methods.", e);
  interrupt = null;
  transition = null;
}


// Apply the patch only if the functions were successfully identified and are *still* missing
// (This part might be redundant if d3-transition works correctly, but acts as a fallback)
if (interrupt && typeof d3Selection.selection.prototype.interrupt !== 'function') {
  d3Selection.selection.prototype.interrupt = interrupt;
  console.log("d3-patch: Applied .interrupt() to d3-selection prototype (fallback).");
}

if (transition && typeof d3Selection.selection.prototype.transition !== 'function') {
  d3Selection.selection.prototype.transition = transition;
   console.log("d3-patch: Applied .transition() to d3-selection prototype (fallback).");
}

// Final check log
if (!interrupt || !transition) {
    console.warn("d3-patch: Patch could not be fully applied. Methods might be missing or import failed.");
} else {
    console.log("d3-patch: Patch check complete.");
}
