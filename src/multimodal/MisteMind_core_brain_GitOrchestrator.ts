import simpleGit, { SimpleGit } from 'simple-git';

export class GitOrchestrator {
  private git: SimpleGit;

  constructor(baseDir: string = process.cwd()) {
    this.git = simpleGit(baseDir);
  }

  // 1. Проверка на статуса (Очите на агента)
  public async getStatus(): Promise<string> {
    try {
      const status = await this.git.status();
      if (status.isClean()) {
        return "GIT STATUS: Clean. Nothing to commit.";
      }
      return `GIT STATUS: Dirty\nModified: ${status.modified.length}\nCreated: ${status.created.length}\nDeleted: ${status.deleted.length}\nFiles: ${status.files.map(f => f.path).join(', ')}`;
    } catch (e: any) {
      return `GIT ERROR: ${e.message}`;
    }
  }

  // 2. Автоматичен Commit (Ръцете на агента)
  public async commitChanges(message: string): Promise<string> {
    try {
      await this.git.add('.')
      const result = await this.git.commit(message);
      return `SUCCESS: Committed on branch [${result.branch}]. Commit ID: ${result.commit}. Summary: ${result.summary.changes} changes.`;
    } catch (e: any) {
      return `COMMIT FAILED: ${e.message}`;
    }
  }

  // 3. Извличане на история (Паметта на агента)
  public async getLog(count: number = 5): Promise<string> {
    try {
      const log = await this.git.log({ maxCount: count });
      return log.all.map(l => `[${l.date.substring(0, 10)}] ${l.message} (${l.author_name})`).join('\n');
    } catch (e: any) {
      return `LOG ERROR: ${e.message}`;
    }
  }

  // 4. Push към GitHub (Гласът към света)
  public async pushChanges(): Promise<string> {
    try {
      await this.git.push();
      return "SUCCESS: Changes pushed to origin.";
    } catch (e: any) {
      return `PUSH FAILED: ${e.message}`;
    }
  }
}
