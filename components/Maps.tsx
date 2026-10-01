import { geoCentroid, geoNaturalEarth1, geoOrthographic, geoPath, type GeoPermissibleObjects } from "d3-geo";
import { feature } from "topojson-client";
import type { FeatureCollection, Geometry } from "geojson";
import world from "world-atlas/countries-110m.json";

const countries = (feature(world as any, (world as any).objects.countries) as unknown as FeatureCollection<Geometry>)
  .features;

export const MAP_CREDIT = "Map: Natural Earth (public domain)";

/** A globe turned to face one country, which is coloured in and ringed so small countries are easy to spot. */
export function Globe({ mapId, name }: { mapId: string; name: string }) {
  const target = countries.find((f) => String(f.id) === mapId);
  const [lon, lat] = target ? geoCentroid(target) : [0, 0];
  const projection = geoOrthographic().rotate([-lon, -lat]).translate([150, 150]).scale(140).clipAngle(90);
  const path = geoPath(projection);
  const centre = projection([lon, lat]);

  return (
    <svg viewBox="0 0 300 300" role="img" aria-label={`Globe showing ${name}`} className="h-full w-full">
      <circle cx="150" cy="150" r="140" fill="#bfe3ff" />
      {countries.map((f, i) => (
        <path
          key={i}
          d={path(f as GeoPermissibleObjects) ?? undefined}
          fill={f === target ? "#e2574c" : "#b9dba0"}
          stroke="#ffffff"
          strokeWidth="0.5"
        />
      ))}
      {centre && <circle cx={centre[0]} cy={centre[1]} r="26" fill="none" stroke="#e2574c" strokeWidth="3" strokeDasharray="6 5" />}
      <circle cx="150" cy="150" r="140" fill="none" stroke="#8ec3ee" strokeWidth="2" />
    </svg>
  );
}

/** Flat world map with the visited countries coloured in. */
export function WorldMap({ visitedIds }: { visitedIds: string[] }) {
  const projection = geoNaturalEarth1().fitSize([800, 400], { type: "Sphere" });
  const path = geoPath(projection);
  return (
    <svg viewBox="0 0 800 400" role="img" aria-label="World map of visited countries" className="w-full">
      <path d={path({ type: "Sphere" }) ?? undefined} fill="#bfe3ff" />
      {countries.map((f, i) => (
        <path
          key={i}
          d={path(f as GeoPermissibleObjects) ?? undefined}
          fill={visitedIds.includes(String(f.id)) ? "#e2574c" : "#dfe8d2"}
          stroke="#ffffff"
          strokeWidth="0.4"
        />
      ))}
    </svg>
  );
}
