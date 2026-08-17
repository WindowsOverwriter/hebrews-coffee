<script>
  import { onMount } from 'svelte';
  import { getLocations } from '../lib/api.js';

  let locations = $state([]);

  function toDate(iso) {
    return new Date(iso + 'T00:00:00');
  }

  function shortDate(d) {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function buildRanges(dates) {
    if (!dates || dates.length === 0) return [];
    const sorted = [...dates].sort();
    const ranges = [];
    let start = toDate(sorted[0]);
    let end = start;

    for (let i = 1; i < sorted.length; i++) {
      const cur = toDate(sorted[i]);
      // M3: Math.round guards against DST transitions — day-to-day ms diff
      // can be 23h or 25h across "spring forward" / "fall back", so a raw
      // divide gives 0.958.../1.041... and breaks the === 1 check.
      const diff = Math.round((cur - end) / 86400000);
      if (diff === 1) {
        end = cur;
      } else {
        ranges.push({ start, end });
        start = cur;
        end = cur;
      }
    }
    ranges.push({ start, end });
    return ranges;
  }

  function formatRange(r) {
    if (r.start.getTime() === r.end.getTime()) {
      return shortDate(r.start);
    }
    if (r.start.getMonth() === r.end.getMonth()) {
      return `${shortDate(r.start)}–${r.end.getDate()}`;
    }
    return `${shortDate(r.start)} – ${shortDate(r.end)}`;
  }

  const MAX_RANGES = 3;

  onMount(async () => {
    try {
      const data = await getLocations();
      locations = data.locations;
    } catch (e) {
      // Silently fail — section just won't show locations
    }
  });
</script>

<main class="landing" id="main-content">
  <!-- Hero Section -->
  <section class="hero" aria-labelledby="hero-title">
    <div class="hero-inner">
      <div class="logo-mark">
        <img src="/logo.svg" alt="HeBrews Coffee logo" class="hero-logo" />
      </div>

      <h1 class="hero-title" id="hero-title">HeBrews Coffee</h1>
      <p class="hero-tagline">Freshly brewed, made to order.</p>

      <div class="hero-ctas">
        <a href="#/order" class="cta cta-primary">Place an Order</a>
        <a href="#/check" class="cta cta-secondary">Check My Order</a>
      </div>
    </div>

    <div class="hero-beans" aria-hidden="true">
      <!-- Bottom-left cluster -->
      <svg class="bean b1" viewBox="0 0 32 44"><ellipse cx="16" cy="22" rx="13" ry="20" stroke-width="2"/><path class="bean-crease" d="M16 4 C12 14, 12 30, 16 40" fill="none" stroke-width="2.5" stroke-linecap="round"/><path class="bean-highlight" d="M17.5 5 C13.5 15, 13.5 29, 17.5 39" fill="none" stroke-width="1" stroke-linecap="round" opacity="0.5"/></svg>
      <svg class="bean b2" viewBox="0 0 32 44"><ellipse cx="16" cy="22" rx="13" ry="20" stroke-width="2"/><path class="bean-crease" d="M16 4 C12 14, 12 30, 16 40" fill="none" stroke-width="2.5" stroke-linecap="round"/><path class="bean-highlight" d="M17.5 5 C13.5 15, 13.5 29, 17.5 39" fill="none" stroke-width="1" stroke-linecap="round" opacity="0.5"/></svg>
      <svg class="bean b3" viewBox="0 0 32 44"><ellipse cx="16" cy="22" rx="13" ry="20" stroke-width="2"/><path class="bean-crease" d="M16 4 C12 14, 12 30, 16 40" fill="none" stroke-width="2.5" stroke-linecap="round"/><path class="bean-highlight" d="M17.5 5 C13.5 15, 13.5 29, 17.5 39" fill="none" stroke-width="1" stroke-linecap="round" opacity="0.5"/></svg>
      <svg class="bean b4" viewBox="0 0 32 44"><ellipse cx="16" cy="22" rx="13" ry="20" stroke-width="2"/><path class="bean-crease" d="M16 4 C12 14, 12 30, 16 40" fill="none" stroke-width="2.5" stroke-linecap="round"/><path class="bean-highlight" d="M17.5 5 C13.5 15, 13.5 29, 17.5 39" fill="none" stroke-width="1" stroke-linecap="round" opacity="0.5"/></svg>
      <!-- Bottom-right cluster -->
      <svg class="bean b5" viewBox="0 0 32 44"><ellipse cx="16" cy="22" rx="13" ry="20" stroke-width="2"/><path class="bean-crease" d="M16 4 C12 14, 12 30, 16 40" fill="none" stroke-width="2.5" stroke-linecap="round"/><path class="bean-highlight" d="M17.5 5 C13.5 15, 13.5 29, 17.5 39" fill="none" stroke-width="1" stroke-linecap="round" opacity="0.5"/></svg>
      <svg class="bean b6" viewBox="0 0 32 44"><ellipse cx="16" cy="22" rx="13" ry="20" stroke-width="2"/><path class="bean-crease" d="M16 4 C12 14, 12 30, 16 40" fill="none" stroke-width="2.5" stroke-linecap="round"/><path class="bean-highlight" d="M17.5 5 C13.5 15, 13.5 29, 17.5 39" fill="none" stroke-width="1" stroke-linecap="round" opacity="0.5"/></svg>
      <svg class="bean b7" viewBox="0 0 32 44"><ellipse cx="16" cy="22" rx="13" ry="20" stroke-width="2"/><path class="bean-crease" d="M16 4 C12 14, 12 30, 16 40" fill="none" stroke-width="2.5" stroke-linecap="round"/><path class="bean-highlight" d="M17.5 5 C13.5 15, 13.5 29, 17.5 39" fill="none" stroke-width="1" stroke-linecap="round" opacity="0.5"/></svg>
      <svg class="bean b8" viewBox="0 0 32 44"><ellipse cx="16" cy="22" rx="13" ry="20" stroke-width="2"/><path class="bean-crease" d="M16 4 C12 14, 12 30, 16 40" fill="none" stroke-width="2.5" stroke-linecap="round"/><path class="bean-highlight" d="M17.5 5 C13.5 15, 13.5 29, 17.5 39" fill="none" stroke-width="1" stroke-linecap="round" opacity="0.5"/></svg>
      <!-- Sparse upper scatter -->
      <svg class="bean b9" viewBox="0 0 32 44"><ellipse cx="16" cy="22" rx="13" ry="20" stroke-width="2"/><path class="bean-crease" d="M16 4 C12 14, 12 30, 16 40" fill="none" stroke-width="2.5" stroke-linecap="round"/><path class="bean-highlight" d="M17.5 5 C13.5 15, 13.5 29, 17.5 39" fill="none" stroke-width="1" stroke-linecap="round" opacity="0.5"/></svg>
      <svg class="bean b10" viewBox="0 0 32 44"><ellipse cx="16" cy="22" rx="13" ry="20" stroke-width="2"/><path class="bean-crease" d="M16 4 C12 14, 12 30, 16 40" fill="none" stroke-width="2.5" stroke-linecap="round"/><path class="bean-highlight" d="M17.5 5 C13.5 15, 13.5 29, 17.5 39" fill="none" stroke-width="1" stroke-linecap="round" opacity="0.5"/></svg>
      <svg class="bean b11" viewBox="0 0 32 44"><ellipse cx="16" cy="22" rx="13" ry="20" stroke-width="2"/><path class="bean-crease" d="M16 4 C12 14, 12 30, 16 40" fill="none" stroke-width="2.5" stroke-linecap="round"/><path class="bean-highlight" d="M17.5 5 C13.5 15, 13.5 29, 17.5 39" fill="none" stroke-width="1" stroke-linecap="round" opacity="0.5"/></svg>
    </div>
  </section>

  <!-- How It Works Section -->
  <section class="how-it-works" aria-labelledby="how-it-works-heading">
    <div class="section-inner">
      <h2 class="section-heading" id="how-it-works-heading">How It Works</h2>
      <ol class="steps" role="list">
        <li class="step">
          <span class="step-number">1</span>
          <div class="step-content">
            <h3>Choose your drink</h3>
            <p>Browse our menu and customize your order just the way you like it.</p>
          </div>
        </li>
        <li class="step">
          <span class="step-number">2</span>
          <div class="step-content">
            <h3>Pick a time</h3>
            <p>Select a pickup slot that works with your schedule.</p>
          </div>
        </li>
        <li class="step">
          <span class="step-number">3</span>
          <div class="step-content">
            <h3>Grab and go</h3>
            <p>Show up, grab your drink, and enjoy. No waiting in line.</p>
          </div>
        </li>
      </ol>
    </div>
  </section>

  <!-- Locations Section -->
  {#if locations.length > 0}
    <section class="locations" aria-labelledby="locations-heading">
      <div class="section-inner">
        <h2 class="section-heading" id="locations-heading">Find Us</h2>
        <div class="locations-grid">
          {#each locations as loc, li (loc.id)}
            {@const datesLabelId = `loc-${loc.id}-dates-label`}
            <div class="location-card">
              <h3>{loc.name}</h3>
              <address>{loc.address}</address>
              {#if loc.dates && loc.dates.length > 0}
                {@const ranges = buildRanges(loc.dates)}
                {@const extra = ranges.length - MAX_RANGES}
                <div class="upcoming-dates">
                  <span class="dates-label" id={datesLabelId}>Upcoming dates</span>
                  <ul class="date-list" role="list" aria-labelledby={datesLabelId}>
                    {#each ranges.slice(0, MAX_RANGES) as r}
                      <li class="date-chip">{formatRange(r)}</li>
                    {/each}
                    {#if extra > 0}
                      <li class="date-chip date-more" aria-label="{extra} more upcoming date{extra === 1 ? '' : 's'} not shown">+{extra} more</li>
                    {/if}
                  </ul>
                </div>
              {/if}
            </div>
          {/each}
        </div>
      </div>
    </section>
  {/if}

  <!-- Bottom CTA -->
  <section class="bottom-cta" aria-labelledby="bottom-cta-heading">
    <div class="section-inner">
      <h2 id="bottom-cta-heading">Ready for a great cup?</h2>
      <a href="#/order" class="cta cta-primary">Order Now</a>
    </div>
  </section>
</main>

<style>
  /* ─── Landing Layout ─── */
  .landing {
    width: 100%;
    overflow-x: hidden;
  }

  .section-inner {
    max-width: var(--max-width);
    margin: 0 auto;
    padding: var(--spacing-2xl) var(--spacing-lg);
  }

  .section-heading {
    font-family: var(--font-heading);
    color: var(--color-brand-brown);
    font-size: 1.75rem;
    margin-bottom: var(--spacing-xl);
    text-align: center;
  }

  /* ─── Hero ─── */
  .hero {
    position: relative;
    background-color: var(--color-brand-brown);
    color: var(--color-cream);
    text-align: center;
    padding: var(--spacing-2xl) var(--spacing-lg);
    /* M9: vh fallback for browsers without dvh support (older Safari) */
    min-height: 85vh;
    min-height: 85dvh;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .hero-inner {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-lg);
  }

  .logo-mark {
    width: 120px;
    height: 120px;
  }

  .hero-logo {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .hero-title {
    font-family: var(--font-heading);
    font-size: 2.75rem;
    font-weight: 700;
    letter-spacing: -0.02em;
    line-height: 1.1;
    color: var(--color-cream);
  }

  .hero-tagline {
    font-family: var(--font-body);
    font-size: 1.125rem;
    color: var(--color-cream);
    opacity: 0.85;
    max-width: 320px;
    line-height: 1.5;
  }

  .hero-ctas {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
    width: 100%;
    max-width: 320px;
    margin-top: var(--spacing-md);
  }

  /* ─── CTAs ─── */
  .cta {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: var(--min-tap-target);
    padding: var(--spacing-md) var(--spacing-xl);
    border-radius: var(--radius-full);
    font-family: var(--font-body);
    font-size: 1rem;
    font-weight: 600;
    text-decoration: none;
    transition: background-color 0.2s ease, transform 0.1s ease;
    -webkit-tap-highlight-color: transparent;
  }

  .cta:active {
    transform: scale(0.97);
  }

  @media (prefers-reduced-motion: reduce) {
    .cta {
      transition: background-color 0.2s ease;
    }
    .cta:active {
      transform: none;
    }
  }

  .cta-primary {
    background-color: var(--color-cream);
    color: var(--color-brand-brown);
  }

  .cta-primary:hover {
    background-color: var(--color-cream-hover);
  }

  .cta-secondary {
    background-color: transparent;
    color: var(--color-cream);
    border: 2px solid var(--color-brown-light);
  }

  .cta-secondary:hover {
    border-color: var(--color-cream);
  }

  /* ─── Hero Coffee Beans ─── */
  .hero-beans {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: hidden;
  }

  .bean {
    position: absolute;
    opacity: 0.18;
  }

  .bean ellipse {
    fill: var(--color-brown-mid);
    stroke: var(--color-brand-brown);
  }

  .bean .bean-crease {
    stroke: var(--color-brand-brown);
  }

  .bean .bean-highlight {
    stroke: var(--color-brown-light);
  }

  /* Bottom-left cluster — dense, varied sizes and rotations */
  .b1 {
    width: 36px;
    bottom: 6%;
    left: 4%;
    transform: rotate(-25deg);
    opacity: 0.22;
  }

  .b2 {
    width: 28px;
    bottom: 14%;
    left: 9%;
    transform: rotate(40deg);
    opacity: 0.16;
  }

  .b3 {
    width: 22px;
    bottom: 4%;
    left: 14%;
    transform: rotate(-60deg);
    opacity: 0.20;
  }

  .b4 {
    width: 18px;
    bottom: 20%;
    left: 2%;
    transform: rotate(15deg);
    opacity: 0.12;
  }

  /* Bottom-right cluster — dense, varied sizes and rotations */
  .b5 {
    width: 34px;
    bottom: 5%;
    right: 5%;
    transform: rotate(30deg);
    opacity: 0.22;
  }

  .b6 {
    width: 24px;
    bottom: 16%;
    right: 11%;
    transform: rotate(-45deg);
    opacity: 0.15;
  }

  .b7 {
    width: 20px;
    bottom: 3%;
    right: 16%;
    transform: rotate(70deg);
    opacity: 0.19;
  }

  .b8 {
    width: 30px;
    bottom: 22%;
    right: 3%;
    transform: rotate(-10deg);
    opacity: 0.12;
  }

  /* Sparse upper scatter — a few stray beans for balance */
  .b9 {
    width: 16px;
    top: 12%;
    left: 6%;
    transform: rotate(-35deg);
    opacity: 0.09;
  }

  .b10 {
    width: 14px;
    top: 28%;
    right: 7%;
    transform: rotate(55deg);
    opacity: 0.08;
  }

  .b11 {
    width: 18px;
    top: 8%;
    right: 14%;
    transform: rotate(-20deg);
    opacity: 0.07;
  }

  /* ─── How It Works ─── */
  .how-it-works {
    background-color: var(--color-cream);
  }

  .steps {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xl);
    max-width: 500px;
    margin: 0 auto;
  }

  .step {
    display: flex;
    align-items: flex-start;
    gap: var(--spacing-lg);
  }

  .step-number {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background-color: var(--color-brand-brown);
    color: var(--color-cream);
    font-family: var(--font-heading);
    font-size: 1.25rem;
    font-weight: 700;
  }

  .step-content h3 {
    font-family: var(--font-heading);
    font-size: 1.125rem;
    color: var(--color-brand-brown);
    margin-bottom: var(--spacing-xs);
  }

  .step-content p {
    font-size: 0.9375rem;
    color: var(--color-brown-mid);
    line-height: 1.6;
  }

  /* ─── Locations ─── */
  .locations {
    background-color: var(--color-white);
  }

  .locations-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--spacing-lg);
    max-width: 600px;
    margin: 0 auto;
  }

  .location-card {
    background-color: var(--color-cream);
    border-radius: var(--radius-lg);
    padding: var(--spacing-xl);
    border: 1px solid var(--color-brown-light);
  }

  .location-card h3 {
    font-family: var(--font-heading);
    font-size: 1.125rem;
    color: var(--color-brand-brown);
    margin-bottom: var(--spacing-sm);
  }

  .location-card address {
    font-style: normal;
    color: var(--color-brown-mid);
    line-height: 1.7;
  }

  .upcoming-dates {
    margin-top: var(--spacing-md);
    padding-top: var(--spacing-md);
    border-top: 1px solid var(--color-brown-light);
  }

  .dates-label {
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--color-brand-brown);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    display: block;
    margin-bottom: var(--spacing-sm);
  }

  .date-list {
    list-style: none;
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-xs);
  }

  .date-chip {
    background-color: var(--color-white);
    color: var(--color-brown-mid);
    font-size: 0.8125rem;
    padding: 4px 10px;
    border-radius: var(--radius-full);
    border: 1px solid var(--color-brown-light);
    white-space: nowrap;
  }

  .date-more {
    color: var(--color-brown-light);
    font-style: italic;
    border-style: dashed;
  }

  /* ─── Bottom CTA ─── */
  .bottom-cta {
    background-color: var(--color-brand-brown);
    text-align: center;
  }

  .bottom-cta .section-inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-lg);
  }

  .bottom-cta h2 {
    font-family: var(--font-heading);
    color: var(--color-cream);
    font-size: 1.75rem;
  }

  .bottom-cta .cta-primary {
    min-width: 200px;
  }

  /* ─── Desktop Enhancements ─── */
  @media (min-width: 768px) {
    .hero {
      min-height: 80vh;
      min-height: 80dvh;
    }

    .hero-title {
      font-size: 3.5rem;
    }

    .hero-tagline {
      font-size: 1.25rem;
      max-width: 400px;
    }

    .hero-ctas {
      flex-direction: row;
      max-width: none;
      width: auto;
    }

    .cta {
      padding: var(--spacing-md) var(--spacing-2xl);
    }

    .section-heading {
      font-size: 2rem;
    }

    .locations-grid {
      grid-template-columns: 1fr 1fr;
    }

    .steps {
      max-width: 600px;
    }

    .logo-mark {
      width: 150px;
      height: 150px;
    }
  }
</style>
