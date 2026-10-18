'use client';

import { CSSProperties, useState } from 'react';
import { SAMPLE_PASSES } from '@/data/prelaunch';
import SectionLabel from './SectionLabel';

export default function MatchPassPreview() {
  const [selected, setSelected] = useState(0);
  const [moreSports, setMoreSports] = useState(false);
  const visiblePasses = moreSports ? SAMPLE_PASSES : SAMPLE_PASSES.slice(0, 4);
  const pass = SAMPLE_PASSES[selected];
  const details = [['Gate', pass.venue], ['Time', pass.time], ['Skill', pass.skill], ['Host', pass.host]];

  return (
    <section className="section passSection" id="pass" aria-label="Sample match pass">
      <div className="container passLayout">
        <div className="reveal">
          <SectionLabel gate="01" title="The pass" />
          <h2 className="passHeading">Your seat,<br />in your <span className="serif">pocket</span></h2>
          <p className="passDescription">Every game you join becomes a match pass with the place, time, seat and host. Pick a sport to print one.</p>
          <div className="sportTabs" role="group" aria-label="Preview a sport">
            {visiblePasses.map((item, index) => (
              <button key={item.sport} type="button" aria-pressed={index === selected} onClick={() => setSelected(index)}>{item.sport}</button>
            ))}
            <button type="button" aria-expanded={moreSports} onClick={() => {
              if (moreSports && selected >= 4) setSelected(0);
              setMoreSports((expanded) => !expanded);
            }}>{moreSports ? '− Fewer sports' : '+ More sports'}</button>
          </div>
        </div>
        <div className="reveal passPreview">
          <div className="printerSlot" />
          <div className="ticketWindow">
            <div key={pass.sport} className="ticket" style={{ '--pc': pass.color } as CSSProperties} aria-live="polite">
              <div className="ticketMain">
                <div className="mono">Match pass · ShowUp</div>
                <h3 className="ticketSport">{pass.sport}</h3>
                <div className="ticketFields">
                  {details.map(([label, value]) => <div key={label}><small>{label}</small><b>{value}</b></div>)}
                </div>
              </div>
              <div className="ticketStub">
                <div className="mono">Seat</div><strong className={pass.seat.length > 3 ? 'wideSeat' : undefined}>{pass.seat}</strong>
                <div className="barcode" aria-hidden="true">
                  {Array.from({ length: 26 }, (_, index) => <i key={index} style={{ flexGrow: 1 + ((index * 7 + selected) % 4) }} />)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
