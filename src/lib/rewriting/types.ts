export const enum VarType {
  // function or catchclause argument
  ARG,
  // var declaration
  VAR,
  // const declaration
  CONST,
  // function declaration
  FUNCTION_DECL,
  // let declaration
  LET,
  // Used in queries.
  UNKNOWN,
}
