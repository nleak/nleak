import { Program, BlockStatement } from "estree";
import { parseScript as parseJavaScript } from "esprima";
import { generate as generateJavaScript } from "astring";
import {
  SourceMapGenerator,
  SourceMapConsumer,
  RawSourceMap,
} from "source-map";
import { transform as buble } from "buble";
import { transform as babel } from "@babel/core";
import { dirname } from "path";

import { BlockScope, ProxyScope } from "./scopes";
import {
  ES5CheckingVisitor,
  EscapeAnalysisVisitor,
  ScopeCreationVisitor,
  ScopeScanningVisitor,
} from "./visitors";

function exposeClosureStateInternal(
  filename: string,
  source: string,
  sourceMap: SourceMapGenerator,
  agentUrl: string,
  polyfillUrl: string,
  evalScopeName?: string,
  strictMode?: boolean
): string {
  let ast = parseJavaScript(source, { loc: true }); //ECMAScript parser
  console.log("----------");
  // console.log(source);
  console.log(ast);
  // console.log(ast.body[0].constructor.name);
  console.log("----------");

  {
    const firstStatement = ast.body[0];
    if (firstStatement && firstStatement.type === "ExpressionStatement") {
      // Esprima feature.
      if ((<any>firstStatement).directive === "no transform") {
        return source;
      }
    }
  }

  const map = new Map<Program | BlockStatement, BlockScope>();
  // console.log("-----map----");
  // console.log(map); //empty
  // console.log("-----map----");

  const symbols = new Set<string>();
  let globalScope = undefined;
  // console.log("---evalScopeName---");
  // console.log(evalScopeName); // undefined
  // console.log("---evalScopeName---");

  if (evalScopeName) {
    globalScope = new ProxyScope(evalScopeName, strictMode === false);
    // In strict mode, newly defined variables cannot escape.
    if (strictMode) {
      globalScope = new BlockScope(globalScope, true);
    }
  }

  ast = ScopeScanningVisitor.Visit(ast, map, symbols, globalScope);
  console.log(
    "============= after ScopeScanningVisitor.Visit =============",
    symbols,
    globalScope
  );
  ast = EscapeAnalysisVisitor.Visit(ast, map);
  ast = ScopeCreationVisitor.Visit(ast, map, symbols, agentUrl, polyfillUrl);

  //EscapeAnalysisVisitor.Visit(ScopeScanningVisitor.Visit(ast, map, symbols, globalScope), map);

  // ScopeCreationVisitor.Visit(
  //   EscapeAnalysisVisitor.Visit(ScopeScanningVisitor.Visit(ast, map, symbols, globalScope), map), map, symbols, agentUrl, polyfillUrl);
  console.log("----ast after visit-----");

  console.log(ast);
  console.log(ast.body[0]);

  console.log("----ast after visit-----");
  console.log(sourceMap);
  console.log("----map-----");
  console.log(map);
  console.log("----symbols-----");
  console.log(symbols);

  console.log("---- generateJavaScript -----");

  console.log(generateJavaScript(ast, { sourceMap }));
  console.log("---- generateJavaScript -----");

  return generateJavaScript(ast, { sourceMap });
}

function embedSourceMap(source: string, sourceMap: string): string {
  return `${source}//# sourceMappingURL=data:application/json;base64,${new Buffer(
    sourceMap,
    "utf8"
  ).toString("base64")}`;
}

function mergeMaps(
  file: string,
  source: string,
  rawMap1: RawSourceMap,
  rawMap2: RawSourceMap
): string {
  const map1 = new SourceMapConsumer(rawMap1);
  const map2 = new SourceMapConsumer(rawMap2);
  const out = new SourceMapGenerator({ file });

  map2.eachMapping((map) => {
    const og = map1.originalPositionFor({
      line: map.originalLine,
      column: map.originalColumn,
    });
    if (og && og.line !== null && og.column !== null) {
      // generated original source name
      out.addMapping({
        generated: {
          line: map.generatedLine,
          column: map.generatedColumn,
        },
        original: og,
        name: map.name,
        source: map.source,
      });
    }
  });
  out.setSourceContent(file, source);
  return out.toString();
}

function tryJSTransform(
  filename: string,
  source: string,
  transform: (
    filename: string,
    source: string,
    sourceMap: SourceMapGenerator,
    needsBabel: boolean
  ) => string
): string {
  try {
    const sourceMap = new SourceMapGenerator({
      file: filename,
    });
    const converted = transform(filename, source, sourceMap, false);
    sourceMap.setSourceContent(filename, source);
    return embedSourceMap(converted, sourceMap.toString());
  } catch (e) {
    try {
      // Might be ES2015. Try to transform with buble first; it's significantly faster than babel.
      const transformed = buble(source, { source: filename });
      const conversionSourceMap = new SourceMapGenerator({
        file: filename,
      });
      const converted = transform(
        filename,
        transformed.code,
        conversionSourceMap,
        false
      );
      return embedSourceMap(
        converted,
        mergeMaps(
          filename,
          source,
          transformed.map as any,
          (conversionSourceMap as any).toJSON() as RawSourceMap
        )
      );
    } catch (e) {
      try {
        // Might be even crazier ES2015! Use Babel (SLOWEST PATH)
        // Babel wants to know the exact location of this preset plugin.
        // I really don't like Babel's (un)usability.
        const envPath = dirname(
          require.resolve("babel-preset-env/package.json")
        );
        const transformed = babel(source, {
          //sourceMapTarget: filename,
          sourceFileName: filename,
          compact: true,
          sourceMaps: true,
          // Disable modules to disable global "use strict"; declaration
          // https://stackoverflow.com/a/39225403
          presets: [[envPath, { modules: false }]],
        });
        const conversionSourceMap = new SourceMapGenerator({
          file: filename,
        });
        const converted = transform(
          filename,
          transformed.code,
          conversionSourceMap,
          true
        );
        return embedSourceMap(
          converted,
          mergeMaps(
            filename,
            source,
            <any>transformed.map,
            (conversionSourceMap as any).toJSON() as RawSourceMap
          )
        );
      } catch (e) {
        console.error(
          `Unable to transform ${filename} - going to proceed with untransformed JavaScript!\nError:`
        );
        console.error(e);
        return source;
      }
    }
  }
}

/**
 * Ensures that the given JavaScript source file is ES5 compatible.
 * @param filename
 * @param source
 * @param agentUrl
 * @param polyfillUrl
 * @param evalScopeName
 */
export function ensureES5(
  filename: string,
  source: string,
  agentUrl = "bleak_agent.js",
  polyfillUrl = "bleak_polyfill.js",
  evalScopeName?: string
): string {
  return tryJSTransform(
    filename,
    source,
    (filename, source, sourceMap, needsBabel) => {
      const visitor = new ES5CheckingVisitor(needsBabel ? polyfillUrl : null);
      let ast = parseJavaScript(source, { loc: true });
      {
        const firstStatement = ast.body[0];
        if (firstStatement && firstStatement.type === "ExpressionStatement") {
          // Esprima feature.
          if ((<any>firstStatement).directive === "no transform") {
            return source;
          }
        }
      }

      ast = visitor.Program(ast);
      return generateJavaScript(ast, { sourceMap });
    }
  );
}

/**
 * Given a JavaScript source file, modifies all function declarations and expressions to expose
 * their closure state on the function object.
 *
 * @param source Source of the JavaScript file.
 */
export function exposeClosureState(
  filename: string,
  source: string,
  agentUrl = "bleak_agent.js",
  polyfillUrl = "bleak_polyfill.js",
  evalScopeName?: string,
  strictMode?: boolean
): string {
  return tryJSTransform(
    filename,
    source,
    (filename, source, sourceMap, needsBabel) => {
      return exposeClosureStateInternal(
        filename,
        source,
        sourceMap,
        agentUrl,
        needsBabel ? polyfillUrl : null,
        evalScopeName,
        strictMode
      );
    }
  );
}

export function nopTransform(filename: string, source: string): string {
  let ast = parseJavaScript(source, { loc: true });
  const sourceMap = new SourceMapGenerator({
    file: filename,
  });
  sourceMap.setSourceContent(filename, source);
  const converted = generateJavaScript(ast, { sourceMap });
  return embedSourceMap(converted, sourceMap.toString());
}
