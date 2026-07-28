export interface IngestedFile {
  path: string;
  content: string;
}

export interface IngestedRepo {
  owner: string;
  repo: string;
  branch: string;
  files: IngestedFile[];
}
