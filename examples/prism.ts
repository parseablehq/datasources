import sections from "../dist/resources.json";
import integrations from "../dist/integrations.json";

export type TelemetryType = "logs" | "metrics" | "traces";

export type Integration = {
  id: string;
  name: string;
  description: string;
  telemetry_types: TelemetryType[];
  resource: string;
  resource_label: string;
  resource_order: number;
  links: { docs: string };
  assets: { logo: string };
};

export type ResourceSection = {
  id: string;
  label: string;
  order: number;
  items: Integration[];
};

export const allIntegrations = integrations as Integration[];
export const integrationSections = sections as ResourceSection[];

// Example: filter only log integrations
export const logIntegrations = allIntegrations.filter((i) =>
  i.telemetry_types.includes("logs")
);

// --------------------
// UI rendering helpers
// --------------------

/**
 * Returns UI-ready sections with guaranteed ordering
 */
export const renderableSections = integrationSections
  .filter((section) => section.items.length > 0)
  .sort((a, b) => a.order - b.order);

/**
 * Example JSX usage:
 *
 * {renderableSections.map((section) => (
 *   <section key={section.id}>
 *     <h2>{section.label}</h2>
 *     <div className="integration-grid">
 *       {section.items.map((integration) => (
 *         <a
 *           key={integration.id}
 *           href={integration.links.docs}
 *           target="_blank"
 *           rel="noreferrer"
 *           className="integration-card"
 *         >
 *           <img
 *             src={`/integrations-assets/${integration.assets.logo.replace("assets/", "")}`}
 *             alt={`${integration.name} logo`}
 *             width={32}
 *             height={32}
 *           />
 *           <div>
 *             <div className="name">{integration.name}</div>
 *             <div className="description">{integration.description}</div>
 *           </div>
 *         </a>
 *       ))}
 *     </div>
 *   </section>
 * ))}
 */
