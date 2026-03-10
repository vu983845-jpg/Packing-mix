export type RuleType = 'range' | 'max' | 'min';

export interface QualityStandard {
    id: string;
    product_id: string;
    indicator_name: string;
    rule_type: RuleType;
    min_value: number | null;
    max_value: number | null;
    target_value: number | null;
    unit?: string;
}

export interface InspectionValue {
    indicator_name: string;
    cluster_no: number;
    value: number | null;
}

export interface InspectionRowData {
    indicator: string;
    standardStr: string;
    values: (number | null)[];
    totalAverage: number | null;
    status: 'pass' | 'warning' | 'fail';
}

export type CellStatus = 'pass' | 'warning' | 'fail' | 'empty';
