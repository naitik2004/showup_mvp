import { FEATURES } from '@/data/prelaunch';
import SectionLabel from './SectionLabel';

export default function FeatureList() {
  return (
    <section className="section sectionFlush" id="features">
      <div className="container">
        <div className="sectionHeading reveal">
          <SectionLabel gate="02" title="What’s inside" />
          <h2>One product,<br /><span className="serif">six</span> jobs</h2>
        </div>
        <div className="reveal">
          {FEATURES.map((feature, index) => (
            <div className="featureRow" key={feature.title}>
              <span className="mono">{String(index + 1).padStart(2, '0')}</span>
              <h3>{feature.title}</h3><p>{feature.description}</p><i aria-hidden="true">→</i>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
