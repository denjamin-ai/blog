import { Diagram } from "./diagram";

interface CircuitProps {
  code?: string;
}

export function Circuit({ code = "" }: CircuitProps) {
  return <Diagram type="tikz" chart={code} />;
}
