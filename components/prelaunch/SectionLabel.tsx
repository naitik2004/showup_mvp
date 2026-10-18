export default function SectionLabel({ gate, title }: { gate: string; title: string }) {
  return <div className="sectionLabel mono"><span>Gate {gate}</span><span>{title}</span></div>;
}
