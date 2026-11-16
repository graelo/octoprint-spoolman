const assert = require('node:assert/strict');
const test = require('node:test');
const {
    getFilamentToolIndex,
    getSpoolDataForFilament,
} = require('../octoprint_Spoolman/static/js/common/filamentTool.js');

const spool = (remaining_weight, diameter, density) => ({
    remaining_weight,
    filament: { diameter, density },
});

const calculateWeight = (length, filament) => {
    const radius = filament.diameter / 2;
    return length * Math.PI * radius ** 2 / 1000 * filament.density;
};

test('resolves a filtered Tool 1 filament to Tool 1 spool metadata', () => {
    const selectedSpools = [
        { spoolData: spool(20, 1.75, 1.24) },
        { spoolData: spool(500, 2.85, 1.04) },
    ];
    const modelFilament = {
        name: () => 'Tool 1',
        data: () => ({ length: 30000 }),
    };

    const spoolData = getSpoolDataForFilament(modelFilament, selectedSpools);
    const modelWeight = calculateWeight(modelFilament.data().length, spoolData.filament);

    assert.equal(spoolData.remaining_weight, 500);
    assert.ok(modelWeight <= spoolData.remaining_weight);
    assert.notEqual(
        modelWeight,
        calculateWeight(modelFilament.data().length, selectedSpools[0].spoolData.filament),
    );
});

test('warns when the matching nonzero-tool spool is insufficient', () => {
    const selectedSpools = [
        { spoolData: spool(20, 1.75, 1.24) },
        { spoolData: spool(1, 2.85, 1.04) },
    ];
    const modelFilament = {
        name: () => 'Tool 1',
        data: () => ({ length: 30000 }),
    };
    const spoolData = getSpoolDataForFilament(modelFilament, selectedSpools);
    const modelWeight = calculateWeight(modelFilament.data().length, spoolData.filament);

    assert.equal(spoolData.remaining_weight, 1);
    assert.ok(modelWeight > spoolData.remaining_weight);
});

test('maps tool 0 and simultaneously used tools to their own spools', () => {
    const selectedSpools = [
        { spoolData: spool(20, 1.75, 1.24) },
        { spoolData: spool(500, 2.85, 1.04) },
        { spoolData: spool(200, 1.75, 1.24) },
        { spoolData: spool(300, 2.85, 1.04) },
    ];

    assert.equal(
        getSpoolDataForFilament({ name: () => 'Tool 0' }, selectedSpools),
        selectedSpools[0].spoolData,
    );
    assert.equal(
        getSpoolDataForFilament({ name: () => 'Tool 1' }, selectedSpools),
        selectedSpools[1].spoolData,
    );
    assert.equal(
        getSpoolDataForFilament({ name: () => 'Tool 3' }, selectedSpools),
        selectedSpools[3].spoolData,
    );
});

test('preserves tool identity for noncontiguous and double-digit tools', () => {
    const names = ['Tool 1', 'Tool 3', 'Tool 12'];
    assert.deepEqual(names.map(getFilamentToolIndex), [1, 3, 12]);
});

test('uses the numeric suffix independently of the translated tool label', () => {
    assert.equal(getFilamentToolIndex('Extrusor 1'), 1);
});

test('does not infer a tool index from a name without a trailing number', () => {
    assert.equal(getFilamentToolIndex(undefined), undefined);
    assert.equal(getFilamentToolIndex('Tool'), undefined);
    assert.equal(getFilamentToolIndex('Tool 1 (unused)'), undefined);
});

test('returns no spool metadata when the selected tool has no spool', () => {
    assert.equal(
        getSpoolDataForFilament({ name: () => 'Tool 1' }, [{ spoolData: spool(20, 1.75, 1.24) }]),
        undefined,
    );
});
