export function trimMatrixEnd<T>(matrix: T[][] | T[]): T[][] | T[] {
    // Input validation
    if (!Array.isArray(matrix) || matrix.length === 0) {
        return matrix;
    }

    // Check if it's a 2D array (matrix) or 1D array
    const isMatrix = Array.isArray(matrix[0]);
    
    if (isMatrix) {
        // Find the last non-empty row
        let lastNonEmptyRow = matrix.length - 1;
        while (lastNonEmptyRow >= 0) {
            const row = matrix[lastNonEmptyRow] as T[];
            // Check if row is entirely empty (null, undefined, empty string, or only whitespace)
            const isEmpty = row.every(item => 
                item === null || 
                item === undefined || 
                (typeof item === 'string' && item.trim() === '')
            );
            if (!isEmpty) break;
            lastNonEmptyRow--;
        }
        
        // Return trimmed matrix (or original if no trimming needed)
        return lastNonEmptyRow < matrix.length - 1 
            ? matrix.slice(0, lastNonEmptyRow + 1)
            : matrix;
    } else {
        // Handle 1D array
        let lastNonEmptyIndex = matrix.length - 1;
        while (lastNonEmptyIndex >= 0) {
            const item = matrix[lastNonEmptyIndex] as T;
            // Check if item is empty (null, undefined, empty string, or only whitespace)
            if (item !== null && 
                item !== undefined && 
                !(typeof item === 'string' && item.trim() === '')) {
                break;
            }
            lastNonEmptyIndex--;
        }
        
        // Return trimmed array (or original if no trimming needed)
        return lastNonEmptyIndex < matrix.length - 1 
            ? matrix.slice(0, lastNonEmptyIndex + 1)
            : matrix;
    }
}
