import { Project } from "ts-morph";
import type { IngestedFile } from "@/core/ingestion/types";

export interface RawFileImports {
  path: string;
  specifiers: string[];
}

export function extractRawImports(files: IngestedFile[]): RawFileImports[] {
  const project = new Project({ useInMemoryFileSystem: true });

  for (const file of files) {
    project.createSourceFile(file.path, file.content);
  }

  return project.getSourceFiles().map((sourceFile) => {
    const importSpecifiers = sourceFile
      .getImportDeclarations()
      .map((decl) => decl.getModuleSpecifierValue());

    const reExportSpecifiers = sourceFile
      .getExportDeclarations()
      .map((decl) => decl.getModuleSpecifierValue())
      .filter((spec): spec is string => Boolean(spec));

    return {
      path: sourceFile.getFilePath().replace(/^\//, ""),
      specifiers: [...importSpecifiers, ...reExportSpecifiers],
    };
  });
}
