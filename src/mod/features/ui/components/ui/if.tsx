export function If(props: { condition: boolean; fallback?: React.ReactNode; children: React.ReactNode }) {
  return props.condition ? props.children : props.fallback
}
