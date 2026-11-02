import { Button } from '../components/ui/Button';
import { Callout } from '../components/ui/Callout';
import { CodeBlock } from '../components/ui/CodeBlock';
import { OhmsLaw } from '../components/widgets/OhmsLaw';
import { Slider } from '../components/ui/Slider';
import { useState } from 'react';

/** The style tile: every decision in docs/DESIGN.md, on one page, so the look can be
 *  judged before the whole app is built in it. */
export function StylePage() {
  const [demo, setDemo] = useState(47);

  return (
    <main className="mx-auto max-w-[1100px] px-4 py-12 sm:px-6">
      <header className="border-b border-line pb-8">
        <p className="m-0 font-mono text-[12px] uppercase tracking-[0.14em] text-accent">
          design direction
        </p>
        <h1 className="mt-3 mb-0 font-sans text-[length:var(--t-display)] font-bold leading-[1.05] tracking-[-0.02em] text-ink">
          Style tile
        </h1>
        <p className="mt-4 mb-0 max-w-[62ch] font-serif text-[1.125rem] leading-[1.65] text-ink-2">
          A beautiful technical notebook that happens to be a pro tool. Colour only ever carries
          meaning. Full reasoning in <code className="font-mono text-[0.9em]">docs/DESIGN.md</code>.
        </p>
      </header>

      <Section title="Surfaces and ink" note="Near-black with a green cast. Borders do the work, not shadows.">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ['--color-bg', 'Background'],
            ['--color-surface', 'Surface'],
            ['--color-surface-2', 'Raised'],
            ['--color-line-strong', 'Border'],
          ].map(([token, label]) => (
            <Swatch key={token} token={token} label={label} />
          ))}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ['--color-ink', 'Primary text'],
            ['--color-ink-2', 'Secondary'],
            ['--color-ink-3', 'Muted'],
            ['--color-accent', 'Accent (copper)'],
          ].map(([token, label]) => (
            <Swatch key={token} token={token} label={label} />
          ))}
        </div>
      </Section>

      <Section
        title="Signal colours"
        note="These four mean the same thing in every lesson, widget and 3D scene. Never decoration."
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ['--color-volt', 'Voltage'],
            ['--color-amp', 'Current'],
            ['--color-ohm', 'Resistance'],
            ['--color-gnd', 'Ground'],
          ].map(([token, label]) => (
            <Swatch key={token} token={token} label={label} />
          ))}
        </div>
      </Section>

      <Section title="Type" note="Archivo for the tool, Source Serif 4 for reading, JetBrains Mono for every number.">
        <div className="rounded-[var(--radius-md)] border border-line bg-surface p-6">
          <p className="m-0 font-sans text-[length:var(--t-h1)] font-bold leading-[1.1] tracking-[-0.02em] text-ink">
            What electricity actually is
          </p>
          <p className="mt-2 mb-0 font-sans text-[length:var(--t-h3)] font-semibold text-ink">
            Voltage is a difference, not a thing
          </p>
          <p className="mt-4 mb-0 max-w-[68ch] font-serif text-[length:var(--t-body)] leading-[1.7] text-ink">
            A battery does not contain electricity waiting to come out. It contains a chemical
            reaction that pushes charge around a loop, and the strength of that push is what we
            call voltage. If the loop is broken, nothing moves — the push is still there, and
            nothing happens.
          </p>
          <p className="mt-3 mb-0 font-mono text-[14px] tabular-nums text-ink-2">
            I = (5 V − 2 V) ÷ 220 Ω = 13.6 mA
          </p>
        </div>
      </Section>

      <Section title="Controls" note="Every state defined: rest, hover, focus, active, disabled.">
        <div className="flex flex-wrap items-center gap-3 rounded-[var(--radius-md)] border border-line bg-surface p-5">
          <Button variant="primary">Start module</Button>
          <Button>Open the Lab</Button>
          <Button variant="ghost">Skip</Button>
          <Button variant="danger">Clear bench</Button>
          <Button disabled>Locked</Button>
        </div>
        <div className="mt-3 max-w-[380px] rounded-[var(--radius-md)] border border-line bg-surface p-5">
          <Slider
            label="Resistance"
            value={demo}
            min={10}
            max={100_000}
            onChange={(v) => setDemo(Math.round(v))}
            display={`${demo} Ω`}
            color="var(--color-ohm)"
            logarithmic
          />
        </div>
      </Section>

      <Section title="Callouts" note="Muted, ink-tinted accents, kept clear of the signal colours.">
        <div className="prose max-w-none">
          <Callout type="intuition">
            Think of voltage as the pressure in a water pipe and current as the water that
            actually moves. The pressure can be there with nothing flowing.
          </Callout>
          <Callout type="math">
            <strong>Powers of ten.</strong> 1 mA means one thousandth of an amp, so 20 mA = 0.020 A.
            Moving the decimal point three places is the whole trick.
          </Callout>
          <Callout type="warning">
            A breadboard&apos;s power rails are sometimes split in the middle. If half your
            board is dead, that is the first thing to check.
          </Callout>
          <Callout type="mistake">
            Hooking an LED straight across a battery. An LED does not limit its own current, so
            it takes as much as the battery will give — and then stops being an LED.
          </Callout>
          <Callout type="safety">
            Everything in this course runs from USB or small batteries. Mains voltage in the
            Netherlands is 230 V and it kills people. We never go near it.
          </Callout>
          <Callout type="datasheet">
            &ldquo;Absolute maximum ratings&rdquo; is not a target. It is the line past which
            the manufacturer stops promising the part works at all.
          </Callout>
          <Callout type="build">
            Place a 330 Ω resistor from row 5 to row 8, put the LED&apos;s long leg in the same
            row as the resistor&apos;s lower leg, then wire the short leg back to ground.
          </Callout>
        </div>
      </Section>

      <Section title="Code" note="Mono, bordered, with a copy button and the language on show.">
        <div className="prose max-w-none">
          <CodeBlock
            language="cpp"
            code={`// Blink the LED on pin 2 once a second.\nvoid setup() {\n  pinMode(2, OUTPUT);   // the pin becomes an output\n}\n\nvoid loop() {\n  digitalWrite(2, HIGH); // 3.3 V on the pin\n  delay(500);            // wait half a second\n  digitalWrite(2, LOW);  // 0 V on the pin\n  delay(500);\n}`}
          />
        </div>
      </Section>

      <Section title="A widget" note="The thing that makes this app worth opening.">
        <div className="prose max-w-none">
          <OhmsLaw />
        </div>
      </Section>
    </main>
  );
}

function Section({ title, note, children }: { title: string; note: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-line py-10">
      <h2 className="m-0 font-sans text-[length:var(--t-h2)] font-semibold tracking-tight text-ink">
        {title}
      </h2>
      <p className="mt-1.5 mb-5 max-w-[68ch] font-sans text-[13.5px] leading-[1.55] text-ink-2">
        {note}
      </p>
      {children}
    </section>
  );
}

function Swatch({ token, label }: { token: string; label: string }) {
  return (
    <div className="overflow-hidden rounded-[var(--radius-md)] border border-line">
      <div className="h-16" style={{ background: `var(${token})` }} />
      <div className="bg-surface px-3 py-2">
        <div className="font-sans text-[13px] text-ink">{label}</div>
        <div className="font-mono text-[11px] text-ink-3">{token.replace('--color-', '')}</div>
      </div>
    </div>
  );
}
