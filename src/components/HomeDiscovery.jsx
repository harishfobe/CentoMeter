import React, { useMemo } from "react";
import { ArrowRight, Heart, MapPin, Sparkles } from "lucide-react";
import AgentCard from "./agent/AgentCard";
import PropertyCard from "./PropertyCard";
import Empty from "./Empty";
import { money } from "../PropertyModel";
import { landPrice } from "../JourneyUX";
import { priceBasis } from "../Journeys";
import { pinPrice } from "../PlotUI";
import { developerFor } from "../SearchSuggestions";

const photo = (p) => p.photos?.[0] || `/${p.image || "apartment"}.jpg`;

export default function HomeDiscovery({
  items,
  city,
  agents = [],
  agentItems = [],
  onNavigate,
  saved,
  recent,
  onSave,
  onOpen,
  onBrowse,
  priceUnit,
}) {
  const { suggested, spotlight, projects, popular, hasActivity } =
    useMemo(() => {
      const seen = new Set(recent),
        kept = new Set(saved);
      const last = items.find((p) => p.id === recent[0]);
      const suggested = [...items]
        .sort((a, b) => {
          const score = (p) =>
            Number(p.type === last?.type) +
            Number(p.locality === last?.locality);
          return score(b) - score(a);
        })
        .slice(0, 3);
      const spotlight =
        items.find((p) => ["Villa", "Independent House"].includes(p.type)) ||
        items[0];
      const projects = items
        .filter((p) => p.mode === "BUY" && p.seller === "Builder")
        .slice(0, 3);
      const popular = [...items]
        .sort(
          (a, b) =>
            Number(kept.has(b.id)) * 2 +
            Number(seen.has(b.id)) -
            (Number(kept.has(a.id)) * 2 + Number(seen.has(a.id))),
        )
        .slice(0, 4);
      return {
        suggested,
        spotlight,
        projects,
        popular,
        hasActivity: items.some((p) => kept.has(p.id) || seen.has(p.id)),
      };
    }, [items, recent, saved]);
  const localAgents = useMemo(
    () =>
      agents
        .filter((a) => a.city === city)
        .sort(
          (a, b) =>
            Number(b.verified) - Number(a.verified) ||
            (b.closedDeals || 0) - (a.closedDeals || 0),
        )
        .slice(0, 3),
    [agents, city],
  );
  const topAgents = localAgents.length > 0 && (
    <section
      className="home-top-agents agent-finder"
      aria-label="Top rated agents"
    >
      <div className="home-section-heading">
        <div>
          <h2>Top rated agents</h2>
          <p>Featured local experts · Customer ratings aren't available yet</p>
        </div>
        <button className="text-button" onClick={() => onNavigate("agents")}>
          See all agents <ArrowRight size={14} aria-hidden="true" />
        </button>
      </div>
      <div className="home-agents-stack">
        {localAgents.map((a) => (
          <AgentCard
            key={a.id}
            agent={a}
            items={agentItems}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </section>
  );
  const price = (p) => {
    if (p.type === "Land" && p.mode !== "BUY") return pinPrice(p, money);
    const amount = landPrice(p, priceUnit);
    return (
      money(amount.amount) +
      (p.type === "Land" && p.mode === "BUY"
        ? amount.suffix || " total"
        : priceBasis(p))
    );
  };
  const card = (p) => (
    <PropertyCard
      key={p.id}
      p={p}
      saved={saved.includes(p.id)}
      onSave={onSave}
      onOpen={onOpen}
      priceUnit={priceUnit}
    />
  );
  const heading = (title, description, more = true) => (
    <div className="home-section-heading">
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {more && (
        <button
          className="text-button"
          onClick={onBrowse}
          aria-label={`See all ${title.toLowerCase()}`}
        >
          See all <ArrowRight size={14} aria-hidden="true" />
        </button>
      )}
    </div>
  );
  if (!items.length)
    return (
      <div className="home-discovery">
        <Empty
          title="No matching suggestions"
          description="Try another property type or adjust your filters."
          action="Browse all properties"
          onAction={onBrowse}
        />
        {topAgents}
      </div>
    );
  return (
    <div className="home-discovery">
      <section aria-label="Suggested properties">
        {heading("Suggested for you", `Homes to explore in ${city}`)}
        <div className="home-card-stack">{suggested.map(card)}</div>
      </section>
      {spotlight && (
        <section aria-label="Spotlight property">
          {heading("Spotlight", "A closer look at a sample property", false)}
          <article className="home-spotlight">
            <img
              src={photo(spotlight)}
              alt=""
              width="800"
              height="500"
              loading="lazy"
            />
            <span className="home-spotlight-tag">
              <Sparkles size={12} aria-hidden="true" /> Spotlight
            </span>
            <button
              className="save-button"
              aria-label={
                (saved.includes(spotlight.id) ? "Unsave " : "Save ") +
                spotlight.title
              }
              aria-pressed={saved.includes(spotlight.id)}
              onClick={() => onSave(spotlight.id)}
            >
              <Heart
                size={18}
                fill={saved.includes(spotlight.id) ? "currentColor" : "none"}
              />
            </button>
            <div className="home-spotlight-copy">
              <strong>{price(spotlight)}</strong>
              <h3>{spotlight.title}</h3>
              <p>
                <MapPin size={12} aria-hidden="true" />
                {spotlight.locality}, {spotlight.city} ·{" "}
                {spotlight.area.toLocaleString("en-IN")} sq ft
              </p>
              <button className="primary" onClick={() => onOpen(spotlight)}>
                View property <ArrowRight size={14} aria-hidden="true" />
              </button>
            </div>
          </article>
        </section>
      )}
      {projects.length > 0 && (
        <section aria-label="Property projects">
          {heading("Projects", "Sample developments from local builders")}
          <div className="home-card-stack">
            {projects.map((p) => (
              <div className="home-project" key={p.id}>
                {card(p)}
                {developerFor(p) && (
                  <p className="home-project-developer">By {developerFor(p)}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
      <section aria-label="Popular properties">
        {heading(
          "Most popular",
          hasActivity
            ? "Saved and viewed on this device"
            : `Sample picks in ${city}`,
        )}
        <ol className="home-popular-list">
          {popular.map((p, i) => (
            <li key={p.id}>
              <button className="home-popular-open" onClick={() => onOpen(p)}>
                <span className="home-popular-rank" aria-hidden="true">
                  {i + 1}
                </span>
                <img
                  src={photo(p)}
                  alt=""
                  width="72"
                  height="72"
                  loading="lazy"
                />
                <span className="home-popular-copy">
                  <strong>{price(p)}</strong>
                  <span>{p.title}</span>
                  <small>
                    {p.locality}, {p.city}
                  </small>
                </span>
              </button>
              <button
                className="home-popular-save"
                aria-label={
                  (saved.includes(p.id) ? "Unsave " : "Save ") + p.title
                }
                aria-pressed={saved.includes(p.id)}
                onClick={() => onSave(p.id)}
              >
                <Heart
                  size={18}
                  fill={saved.includes(p.id) ? "currentColor" : "none"}
                />
              </button>
            </li>
          ))}
        </ol>
      </section>
      {topAgents}
    </div>
  );
}
