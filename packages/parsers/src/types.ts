export interface NamedImport {
  moduleSpecifier: string;
  names: string[];
}

export interface ParsedModule {
  path: string;
  exports: string[];
  namedImports: NamedImport[];
}

export interface ParsedJsonSchema {
  path: string;
  required: string[];
  properties: string[];
}

export interface ParsedPackageManifest {
  path: string;
  enginesNode: string | null;
  dependencies: string[];
  devDependencies: string[];
}

export interface ParsedEnvTemplate {
  path: string;
  keys: string[];
}

export interface ParsedNodeVersionFile {
  path: string;
  version: string;
}
