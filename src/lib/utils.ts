import { QualityStandard, RuleType, CellStatus } from '@/lib/types';

export const PASS_COLOR = 'var(--color-success-light)';
export const WARN_COLOR = 'var(--color-warning-light)';
export const FAIL_COLOR = 'var(--color-danger-light)';

export function evaluateRule(val: number | null | string, std: QualityStandard): CellStatus {
    if (val === null || val === undefined || val === '') return 'empty';

    const v = Number(val);

    if (std.rule_type === 'max') {
        if (v > (std.max_value || 0)) return 'fail';
        // Warning logic: close to limit by 10%
        const threshold = (std.max_value || 0) * 0.9;
        if (v >= threshold && v <= (std.max_value || 0)) return 'warning';
        return 'pass';
    }

    if (std.rule_type === 'min') {
        if (v < (std.min_value || 0)) return 'fail';
        const threshold = (std.min_value || 0) * 1.1;
        if (v <= threshold && v >= (std.min_value || 0)) return 'warning';
        return 'pass';
    }

    if (std.rule_type === 'range') {
        const min = std.min_value || 0;
        const max = std.max_value || 0;

        if (v < min || v > max) return 'fail';

        // Warning if close to edge (5% of range)
        const rangeDetails = max - min;
        const buffer = rangeDetails * 0.05;
        if (v <= min + buffer || v >= max - buffer) return 'warning';

        return 'pass';
    }

    return 'pass';
}

export function formatStandardStr(std: QualityStandard): string {
    if (std.rule_type === 'max') return `<= ${std.max_value}`;
    if (std.rule_type === 'min') return `>= ${std.min_value}`;
    if (std.rule_type === 'range') return `${std.min_value} - ${std.max_value}`;
    return '';
}

// Temporary static list of standards matching prompt, used until DB is fully connected
export const MOCK_STANDARDS: QualityStandard[] = [
    { id: '1', product_id: '1', indicator_name: 'Hạt', rule_type: 'range', min_value: 300, max_value: 320, target_value: null },
    { id: '2', product_id: '1', indicator_name: 'Bể', rule_type: 'max', min_value: null, max_value: 30, target_value: null },
    { id: '3', product_id: '1', indicator_name: 'LP ss', rule_type: 'max', min_value: null, max_value: 2, target_value: null },
    { id: '4', product_id: '1', indicator_name: 'A', rule_type: 'max', min_value: null, max_value: 1.5, target_value: null },
    { id: '5', product_id: '1', indicator_name: 'B', rule_type: 'max', min_value: null, max_value: 4, target_value: null },
    { id: '6', product_id: '1', indicator_name: 'C', rule_type: 'max', min_value: null, max_value: 7.5, target_value: null },
    { id: '7', product_id: '1', indicator_name: 'Vết dao', rule_type: 'max', min_value: null, max_value: 8, target_value: null },
    { id: '8', product_id: '1', indicator_name: 'Lụa', rule_type: 'max', min_value: null, max_value: 8, target_value: null },
    { id: '9', product_id: '1', indicator_name: 'Total defect', rule_type: 'max', min_value: null, max_value: 29, target_value: null },
];
