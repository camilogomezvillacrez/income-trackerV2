import TreeMark from "./TreeMark";

/*
 * El logo es vectorial (TreeMark). El PNG original venia con fondo blanco y se
 * apoyaba en mixBlendMode:"multiply" para disimularlo, lo que dejaba un recuadro
 * visible sobre fondos con color. El SVG es transparente de verdad y escala.
 *
 * El color por defecto es el sage de la marca --sage (#4A7C59), el mismo de la
 * bottom nav y el avatar; el PNG traia un verde mas apagado (#5A7854).
 */
export default function Logo({
  size = 28,
  draw = false,
  color = "#4A7C59",
}: {
  size?: number;
  draw?: boolean;
  color?: string;
}) {
  return <TreeMark size={size} draw={draw} color={color} />;
}
