/**
 * OctoPrint currently exposes filament usage records with a translated display
 * name ("Tool 1") rather than the original toolN key. The numeric suffix is
 * generated directly from that key in PrinterStateViewModel._processJobData.
 * Keep this parsing isolated so it can be tested independently.
 */
const getFilamentToolIndex = (name) => {
    const resolvedName = typeof name === 'function' ? name() : name;
    const match = String(resolvedName ?? '').match(/(\d+)$/);

    return match ? Number(match[1]) : undefined;
};

const getSpoolDataForFilament = (modelFilament, spools) => {
    const toolIdx = getFilamentToolIndex(modelFilament.name);

    return toolIdx === undefined ? undefined : spools[toolIdx]?.spoolData;
};

// Negative lengths can arise from metadata and format as a misleading -0.0 g.
// Leave nonnumeric lengths unknown instead of treating them as unused.
const isFilamentUsageUnused = (toolFilamentUsage) => (
    !toolFilamentUsage || (
        Number.isFinite(toolFilamentUsage.filamentLength) &&
        toolFilamentUsage.filamentLength <= 0
    )
);

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getFilamentToolIndex,
        getSpoolDataForFilament,
        isFilamentUsageUnused,
    };
}
