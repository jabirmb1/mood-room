// This function just get's a degree and bounds it between -180 degrees and 180 degrees (inclusive), returns bounded degree
//
export function normaliseDegrees(deg: number): number {
    let normalised = deg % 360;
    if (normalised > 180) normalised -= 360;
    if (normalised < -180) normalised += 360;
    return normalised;
}