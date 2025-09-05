import path from "node:path";

export const getProjectRootPath = () => {
    const mastraCwd = process.cwd();
    
    // Remove '.mastra/output' and any subdirectories from the path
    const pathToRemove = path.join('.mastra', 'output');
    const normalizedCwd = path.normalize(mastraCwd);
    
    // Find the index of '.mastra/output' in the path
    const mastraOutputIndex = normalizedCwd.indexOf(path.sep + pathToRemove);
    if (mastraOutputIndex !== -1) {
        return normalizedCwd.substring(0, mastraOutputIndex);
    }
    
    // Also check if the path ends with '.mastra/output' (without leading separator)
    if (normalizedCwd.endsWith(pathToRemove)) {
        return path.dirname(path.dirname(normalizedCwd));
    }
    
    return mastraCwd;
}
