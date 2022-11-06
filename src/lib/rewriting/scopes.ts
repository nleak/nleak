import { ExpressionStatement, VariableDeclaration } from "estree";
import { VarType } from "./types";
import {
  getIdentifierArray,
  getScopeAssignment,
  getScopeProperties,
  getStringLiteralArray,
} from "./utility";

class Variable {
  constructor(
    public readonly type: VarType,
    public closedOver: boolean = false
  ) {}
}

export interface IScope {
  /**
   * Defines the given variable in the scope.
   */
  defineVariable(name: string, type: VarType): void;
  /**
   * A variable is potentially *closed over* iff an inner function
   * references it. Thus, this function checks if the variable is
   * defined within the current function. If it is, it does nothing.
   * If it is not, it tells the parent scopes to move the variable
   * into the heap.
   * @param name
   */
  maybeCloseOverVariable(name: string): void;
  /**
   * Indicates that a call to `eval` was located within this scope.
   */
  evalFound(): void;
  /**
   * Is this the top-level scope in a function?
   */
  isFunctionScope: boolean;
  /**
   * Indicates what scope, if any, the given variable should be moved to.
   * Returns NULL if the variable should not be moved.
   */
  shouldMoveTo(name: string): string;
  /**
   * The identifier of the object containing this scope's variables.
   * Defers to upper scopes if the given scope has no moved variables.
   */
  scopeIdentifier: string;
  /**
   * Finalizes the scope. The given function returns an unbound name.
   */
  finalize(getUnboundName: () => string): void;

  getScopeAssignments(): ExpressionStatement[];

  getType(name: string): VarType;
}

function closeOver(v: Variable): void {
  v.closedOver = true;
}

export class GlobalScope implements IScope {
  public scopeIdentifier: string;
  private _defineFunctionDeclsOnScope: boolean;
  constructor(
    scopeIdentifier = "$$$GLOBAL$$$",
    defineFunctionDeclsOnScope: boolean = false
  ) {
    this.scopeIdentifier = scopeIdentifier;
    this._defineFunctionDeclsOnScope = defineFunctionDeclsOnScope;
  }

  protected _vars = new Map<string, Variable>();
  public defineVariable(name: string, type: VarType): void {
    // Make all global variables closed over.
    this._vars.set(name, new Variable(type, true));
  }
  public prelude(): ExpressionStatement[] {
    const rv: ExpressionStatement[] = [];

    if (this._defineFunctionDeclsOnScope) {
      // scopeidentifier.foo
      this._vars.forEach((v, name) => {
        if (v.type === VarType.FUNCTION_DECL) {
          rv.push({
            type: "ExpressionStatement",
            expression: {
              type: "AssignmentExpression",
              operator: "=",
              left: {
                type: "MemberExpression",
                computed: false,
                object: {
                  type: "Identifier",
                  name: this.scopeIdentifier,
                },
                property: {
                  type: "Identifier",
                  name: name,
                },
                optional: false,
              },
              right: {
                type: "Identifier",
                name: name,
              },
            },
          });
        }
      });
    }
    return rv;
  }
  public maybeCloseOverVariable(name: string): void {}
  public evalFound(): void {}
  public shouldMoveTo(name: string): string {
    if (this._vars.has(name)) {
      return this.scopeIdentifier;
    } else {
      return null;
    }
  }
  public get isFunctionScope() {
    return true;
  }
  public finalize() {}
  public getScopeAssignments(): ExpressionStatement[] {
    const rv = new Array<ExpressionStatement>();
    this._vars.forEach((v, name) => {
      if (v.type === VarType.FUNCTION_DECL) {
        rv.push(getScopeAssignment(name, this.scopeIdentifier));
      }
    });
    return rv;
  }
  public getType(name: string): VarType {
    const entry = this._vars.get(name);
    if (!entry) {
      return VarType.UNKNOWN;
    }
    return entry.type;
  }
}

/**
 * ProxyScope is like GlobalScope, except all non-identifiable
 * property writes are proxied to it. Used for Eval and with()
 * statements.
 */
export class ProxyScope extends GlobalScope {
  public shouldMoveTo(name: string): string {
    // "arguments" is a special-case.
    if (name === "arguments" && !this._vars.has(name)) {
      return null;
    }
    return this.scopeIdentifier;
  }
}

export class BlockScope implements IScope {
  // The parent scope. If null, represents the global scope.
  public readonly parent: IScope;
  protected _scopeIdentifier: string;
  public readonly isFunctionScope: boolean;
  protected _vars = new Map<string, Variable>();
  protected _closedOver: boolean = false;
  protected _evalFound = false;

  constructor(parent: IScope, isFunctionScope: boolean) {
    this.parent = parent;
    this.isFunctionScope = isFunctionScope;
  }

  public finalize(getId: () => string) {
    if (this.hasClosedOverVariables && !this._scopeIdentifier) {
      this._scopeIdentifier = getId();
    }
  }

  public getType(name: string): VarType {
    const entry = this._vars.get(name);
    if (!entry) {
      if (this.parent instanceof BlockScope) {
        return this.parent.getType(name);
      } else {
        return VarType.UNKNOWN;
      }
    }
    return entry.type;
  }

  /**
   * Returns the scope that will act as this scope's parent
   * in the final JavaScript code. We do not emit scopes
   * whose variables are not closed over.
   */
  protected _getEffectiveParent(): IScope {
    let p = this.parent;
    while (p instanceof BlockScope && !p._closedOver) {
      p = p.parent;
    }
    return p;
  }

  public defineVariable(name: string, type: VarType): void {
    if (type === VarType.VAR) {
      if (!this.isFunctionScope) {
        // VAR types must be defined in the top-most scope of a function.
        return this.parent.defineVariable(name, type);
      } else if (this._vars.has(name)) {
        // Redeclaring a variable is a no-op.
        return;
      }
    }
    //    if (this._vars.has(name)) {
    // Merge.
    //      console.warn(`Unifying two variables named ${name}!`);
    //    }
    this._vars.set(name, new Variable(type, this._evalFound));
  }

  public maybeCloseOverVariable(name: string): void {
    if (!this._vars.has(name) && this.parent !== null) {
      if (this.isFunctionScope && this.parent instanceof BlockScope) {
        // Parent belongs to a different function.
        this.parent._closeOverVariable(name);
      } else {
        // Parent *does not* belong to a different function.
        this.parent.maybeCloseOverVariable(name);
      }
    }
  }

  protected _closeOverVariable(name: string): void {
    const v = this._vars.get(name);
    if (v) {
      v.closedOver = true;
      this._closedOver = true;
    } else if (this.parent instanceof BlockScope) {
      this.parent._closeOverVariable(name);
    } else {
      // Otherwise, it's a global variable!
      this.parent.maybeCloseOverVariable(name);
    }
  }

  public shouldMoveTo(name: string): string | null {
    const v = this._vars.get(name);
    if (v) {
      if (v.closedOver) {
        return this.scopeIdentifier;
      } else {
        return null;
      }
    } else {
      return this.parent.shouldMoveTo(name);
    }
  }

  /**
   * Called when a call to eval() is located.
   * Closes over every single variable.
   */
  public evalFound(): void {
    this._evalFound = true;
    this._closedOver = true;
    this._vars.forEach(closeOver);
    this.parent.evalFound();
  }

  public get scopeIdentifier(): string {
    if (!this.hasClosedOverVariables) {
      return this.parent.scopeIdentifier;
    }
    if (this._scopeIdentifier === null) {
      throw new Error(`Cannot retrieve scope identifier of unfinalized scope.`);
    }
    return this._scopeIdentifier;
  }

  public get hasClosedOverVariables(): boolean {
    return this._closedOver;
  }

  public getScopeAssignments(): ExpressionStatement[] {
    const rv = new Array<ExpressionStatement>();
    this._vars.forEach((v, name) => {
      if (v.type === VarType.FUNCTION_DECL) {
        rv.push(getScopeAssignment(name, this.scopeIdentifier));
      }
    });
    return rv;
  }

  public getScopeCreationStatement(): VariableDeclaration {
    const parent = this._getEffectiveParent();
    const movedIdentifiers: string[] = [];
    const unmovedIdentifiers: string[] = [];
    const params: string[] = [];

    this._vars.forEach((v, name) => {
      if (v.closedOver) {
        switch (v.type) {
          case VarType.ARG:
            params.push(name);
            break;
          case VarType.CONST:
          case VarType.FUNCTION_DECL:
            unmovedIdentifiers.push(name);
            break;
          case VarType.LET:
          case VarType.VAR:
            movedIdentifiers.push(name);
            break;
        }
      }
    });

    return {
      type: "VariableDeclaration",
      declarations: [
        {
          type: "VariableDeclarator",
          id: { type: "Identifier", name: this.scopeIdentifier },
          init: {
            type: "CallExpression",
            callee: { type: "Identifier", name: "$$$CREATE_SCOPE_OBJECT$$$" },
            arguments: [
              {
                type: "Identifier",
                name: parent.scopeIdentifier,
              },
              {
                type: "ArrayExpression",
                elements: getStringLiteralArray(movedIdentifiers),
              },
              {
                type: "ObjectExpression",
                properties: getScopeProperties(unmovedIdentifiers),
              },
              {
                type: "ArrayExpression",
                elements: getStringLiteralArray(params),
              },
              {
                type: "ArrayExpression",
                elements: getIdentifierArray(params),
              },
            ],
            optional: false,
          },
        },
      ],
      kind: "var",
    };
  }
}
