import TreeMark from "./TreeMark";

/*
 * El logo ahora es vectorial (TreeMark). El PNG original venia con fondo
 * blanco y se apoyaba en mixBlendMode:"multiply" para disimularlo, lo que
 * dejaba un recuadro visible sobre fondos con color. El SVG es transparente
 * de verdad, escala sin perder nitidez y se puede animar.
 */
export default function Logo({ size = 28, draw = false }: { size?: number; draw?: boolean }) {
  return <TreeMark size={size} draw={draw} color="#5A7854" />;
}
