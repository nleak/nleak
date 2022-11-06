import {
  Node,
  Statement,
  BlockStatement,
  ExpressionStatement,
  IfStatement,
  VariableDeclaration,
  VariableDeclarator,
  ObjectExpression,
  Property,
  FunctionExpression,
  UnaryExpression,
  CallExpression,
  Identifier,
  Literal,
} from "estree";

export function getPolyfillInsertion(url: string): IfStatement {
  return {
    type: "IfStatement",
    test: {
      type: "BinaryExpression",
      operator: "===",
      left: {
        type: "UnaryExpression",
        operator: "typeof",
        argument: {
          type: "Identifier",
          name: "regeneratorRuntime",
        },
        prefix: true,
      } as UnaryExpression,
      right: {
        type: "Literal",
        value: "undefined",
        raw: '"undefined"',
      },
    },
    consequent: {
      type: "BlockStatement",
      body: [
        {
          type: "ExpressionStatement",
          expression: {
            type: "CallExpression",
            callee: {
              type: "Identifier",
              name: "loadScript",
            },
            arguments: [
              {
                type: "Literal",
                value: url,
                raw: `"${url}"`,
              },
            ],
            optional: false,
          },
        },
      ],
    },
    alternate: null,
  };
}

export function getAgentInsertion(url: string): IfStatement {
  return {
    type: "IfStatement",
    test: {
      type: "BinaryExpression",
      operator: "===",
      left: {
        type: "UnaryExpression",
        operator: "typeof",
        argument: {
          type: "Identifier",
          name: "$$$CREATE_SCOPE_OBJECT$$$",
        },
        prefix: true,
      } as UnaryExpression,
      right: {
        type: "Literal",
        value: "undefined",
        raw: '"undefined"',
      },
    },
    consequent: {
      type: "BlockStatement",
      body: [
        {
          type: "ExpressionStatement",
          expression: {
            type: "CallExpression",
            callee: {
              type: "Identifier",
              name: "loadScript",
            },
            arguments: [
              {
                type: "Literal",
                value: url,
                raw: `"${url}"`,
              },
            ],
            optional: false,
          },
        },
      ],
    },
    alternate: null,
  };
}

export function getProgramPrelude(
  statements: IfStatement[]
): ExpressionStatement {
  return {
    type: "ExpressionStatement",
    expression: {
      type: "CallExpression",
      callee: {
        type: "FunctionExpression",
        id: null,
        params: [],
        body: {
          type: "BlockStatement",
          body: (<Statement[]>[
            {
              type: "FunctionDeclaration",
              id: {
                type: "Identifier",
                name: "loadScript",
              },
              params: [
                {
                  type: "Identifier",
                  name: "url",
                },
              ],
              body: {
                type: "BlockStatement",
                body: [
                  {
                    type: "IfStatement",
                    test: {
                      type: "BinaryExpression",
                      operator: "!==",
                      left: {
                        type: "UnaryExpression",
                        operator: "typeof",
                        argument: {
                          type: "Identifier",
                          name: "XMLHttpRequest",
                        },
                        prefix: true,
                      },
                      right: {
                        type: "Literal",
                        value: "undefined",
                        raw: '"undefined"',
                      },
                    },
                    consequent: {
                      type: "BlockStatement",
                      body: [
                        {
                          type: "VariableDeclaration",
                          declarations: [
                            {
                              type: "VariableDeclarator",
                              id: {
                                type: "Identifier",
                                name: "xhr",
                              },
                              init: {
                                type: "NewExpression",
                                callee: {
                                  type: "Identifier",
                                  name: "XMLHttpRequest",
                                },
                                arguments: [],
                              },
                            },
                          ],
                          kind: "var",
                        },
                        {
                          type: "ExpressionStatement",
                          expression: {
                            type: "CallExpression",
                            callee: {
                              type: "MemberExpression",
                              computed: false,
                              object: {
                                type: "Identifier",
                                name: "xhr",
                              },
                              property: {
                                type: "Identifier",
                                name: "open",
                              },
                            },
                            arguments: [
                              {
                                type: "Literal",
                                value: "GET",
                                raw: "'GET'",
                              },
                              {
                                type: "Identifier",
                                name: "url",
                              },
                              {
                                type: "Literal",
                                value: false,
                                raw: "false",
                              },
                            ],
                          },
                        },
                        {
                          type: "ExpressionStatement",
                          expression: {
                            type: "CallExpression",
                            callee: {
                              type: "MemberExpression",
                              computed: false,
                              object: {
                                type: "Identifier",
                                name: "xhr",
                              },
                              property: {
                                type: "Identifier",
                                name: "send",
                              },
                            },
                            arguments: [],
                          },
                        },
                        {
                          type: "ExpressionStatement",
                          expression: {
                            type: "CallExpression",
                            callee: {
                              type: "NewExpression",
                              callee: {
                                type: "Identifier",
                                name: "Function",
                              },
                              arguments: [
                                {
                                  type: "MemberExpression",
                                  computed: false,
                                  object: {
                                    type: "Identifier",
                                    name: "xhr",
                                  },
                                  property: {
                                    type: "Identifier",
                                    name: "responseText",
                                  },
                                },
                              ],
                            },
                            arguments: [],
                          },
                        },
                      ],
                    },
                    alternate: {
                      type: "IfStatement",
                      test: {
                        type: "BinaryExpression",
                        operator: "!==",
                        left: {
                          type: "UnaryExpression",
                          operator: "typeof",
                          argument: {
                            type: "Identifier",
                            name: "importScripts",
                          },
                          prefix: true,
                        },
                        right: {
                          type: "Literal",
                          value: "undefined",
                          raw: '"undefined"',
                        },
                      },
                      consequent: {
                        type: "BlockStatement",
                        body: [
                          {
                            type: "ExpressionStatement",
                            expression: {
                              type: "CallExpression",
                              callee: {
                                type: "Identifier",
                                name: "importScripts",
                              },
                              arguments: [
                                {
                                  type: "Identifier",
                                  name: "url",
                                },
                              ],
                            },
                          },
                        ],
                      },
                      alternate: {
                        type: "BlockStatement",
                        body: [
                          {
                            type: "ThrowStatement",
                            argument: {
                              type: "NewExpression",
                              callee: {
                                type: "Identifier",
                                name: "Error",
                              },
                              arguments: [
                                {
                                  type: "BinaryExpression",
                                  operator: "+",
                                  left: {
                                    type: "Literal",
                                    value: "Unable to load script ",
                                    raw: '"Unable to load script "',
                                  },
                                  right: {
                                    type: "Identifier",
                                    name: "url",
                                  },
                                },
                              ],
                            },
                          },
                        ],
                      },
                    },
                  },
                ],
              },
              generator: false,
              async: false,
            },
          ]).concat(statements),
        },
        generator: false,
        async: false,
      },
      arguments: [],
      optional: false,
    },
  };
}

export function getExpressionTransform(
  originalFunction: FunctionExpression,
  scopeVarName: string
): CallExpression {
  const ce: CallExpression = {
    type: "CallExpression",
    callee: {
      type: "Identifier",
      name: "$$$FUNCTION_EXPRESSION$$$",
      loc: originalFunction.loc,
    },
    arguments: [originalFunction, { type: "Identifier", name: scopeVarName }],
    loc: originalFunction.loc,
    optional: false,
  };
  return ce;
}

export function getObjectExpressionTransform(
  original: ObjectExpression,
  scopeVarName: string
): CallExpression {
  const ce: CallExpression = {
    type: "CallExpression",
    callee: {
      type: "Identifier",
      name: "$$$OBJECT_EXPRESSION$$$",
      loc: original.loc,
    },
    arguments: [original, { type: "Identifier", name: scopeVarName }],
    loc: original.loc,
    optional: false,
  };
  return ce;
}

export function getScopeAssignment(
  functionVarName: string,
  scopeVarName: string
): ExpressionStatement {
  return {
    type: "ExpressionStatement",
    expression: {
      type: "CallExpression",
      callee: {
        type: "MemberExpression",
        computed: false,
        object: {
          type: "Identifier",
          name: "$$$OBJECT$$$",
        },
        property: {
          type: "Identifier",
          name: "defineProperty",
        },
        optional: false,
      },
      arguments: [
        {
          type: "Identifier",
          name: functionVarName,
        },
        {
          type: "Literal",
          value: "__scope__",
          raw: "'__scope__'",
        },
        {
          type: "ObjectExpression",
          properties: [
            {
              type: "Property",
              key: {
                type: "Identifier",
                name: "get",
              },
              computed: false,
              value: {
                type: "FunctionExpression",
                id: null,
                params: [],
                body: {
                  type: "BlockStatement",
                  body: [
                    {
                      type: "ReturnStatement",
                      argument: { type: "Identifier", name: scopeVarName },
                    },
                  ],
                },
                generator: false,
                async: false,
              },
              kind: "init",
              method: false,
              shorthand: false,
            },
            {
              type: "Property",
              key: {
                type: "Identifier",
                name: "configurable",
              },
              computed: false,
              value: {
                type: "Literal",
                value: true,
                raw: "true",
              },
              kind: "init",
              method: false,
              shorthand: false,
            },
          ],
        },
      ],
      optional: false,
    },
  };
}

export function statementToBlock(s: Statement): BlockStatement {
  return {
    type: "BlockStatement",
    body: [s],
    loc: s.loc,
  };
}

export function statementsToBlock(
  parent: Node,
  s: Statement[]
): BlockStatement {
  return {
    type: "BlockStatement",
    body: s,
    loc: parent.loc,
  };
}

export function declarationFromDeclarators(
  kind: "var" | "const" | "let",
  decls: VariableDeclarator[]
): VariableDeclaration {
  return {
    type: "VariableDeclaration",
    kind: kind,
    declarations: decls,
    loc: {
      start: decls[0].loc.start,
      end: decls[decls.length - 1].loc.end,
    },
  };
}

export function getStringLiteralArray(names: string[]): Literal[] {
  return names.map((n): Literal => {
    return { type: "Literal", value: n, raw: `"${n}"` };
  });
}

export function getIdentifierArray(names: string[]): Identifier[] {
  return names.map((n): Identifier => {
    return { type: "Identifier", name: n };
  });
}

export function getScopeProperties(names: string[]): Property[] {
  return names.map((n): Property => {
    return {
      type: "Property",
      key: { type: "Identifier", name: n },
      computed: false,
      value: {
        type: "ObjectExpression",
        properties: [
          {
            type: "Property",
            key: { type: "Identifier", name: "get" },
            computed: false,
            value: {
              type: "FunctionExpression",
              id: null,
              params: [],
              body: {
                type: "BlockStatement",
                body: [
                  {
                    type: "ReturnStatement",
                    argument: {
                      type: "Identifier",
                      name: n,
                    },
                  },
                ],
              },
              generator: false,
              async: false,
            },
            kind: "init",
            method: false,
            shorthand: false,
          },
          {
            type: "Property",
            key: { type: "Identifier", name: "set" },
            computed: false,
            value: {
              type: "FunctionExpression",
              id: null,
              params: [{ type: "Identifier", name: "v" }],
              body: {
                type: "BlockStatement",
                body: [
                  {
                    type: "ExpressionStatement",
                    expression: {
                      type: "AssignmentExpression",
                      operator: "=",
                      left: {
                        type: "Identifier",
                        name: n,
                      },
                      right: {
                        type: "Identifier",
                        name: "v",
                      },
                    },
                  },
                ],
              },
              generator: false,
              async: false,
            },
            kind: "init",
            method: false,
            shorthand: false,
          },
        ],
      },
      kind: "init",
      method: false,
      shorthand: false,
    };
  });
}
