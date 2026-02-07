import { GitOrchestrator } from '../intelligence/GitOrchestrator';

const gitOps = new GitOrchestrator();

export const TOOLS = {
  // ... други инструменти ...
  GIT_STATUS: {
    desc: "Checks the current git status (modified files, staged changes). Use before committing.",
    handler: async () => await gitOps.getStatus()
  },
  GIT_COMMIT: {
    desc: "Stages all files and commits them. REQUIRES a 'message' parameter.",
    handler: async (message: string) => await gitOps.commitChanges(message)
  },
  GIT_HISTORY: {
    desc: "Reads the last 5 commits to understand recent context.",
    handler: async () => await gitOps.getLog()
  }
};
