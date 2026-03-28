import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";

// Fix Leaflet's default icon issue with webpack/vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Hackathon colored markers
const blueIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const greenIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export type MarkerData = {
  id: number;
  lat: number;
  lng: number;
  type: "job" | "worker";

  // job fields
  skill_required?: string;
  salary?: number;
  contractor_name?: string;
  date?: string;
  workers_needed?: number;
  description?: string;

  // worker fields
  name?: string;
  skill?: string;
  rating?: number;
  phone?: string;
};

type MapProps = {
  centerLat: number;
  centerLng: number;
  markers: MarkerData[];
};

function MapUpdater({ lat, lng }: { lat: number, lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], 13);
  }, [lat, lng, map]);
  return null;
}

export function NearbyMap({ centerLat, centerLng, markers }: MapProps) {
  return (
    <div className="h-[300px] w-full mt-4 rounded-xl overflow-hidden shadow ring-1 ring-white/10 z-0 relative isolate">
      <MapContainer 
        center={[centerLat, centerLng]} 
        zoom={13} 
        scrollWheelZoom={false}
        className="h-full w-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapUpdater lat={centerLat} lng={centerLng} />
        
        {markers.map((marker) => (
          <Marker 
            key={`${marker.type}-${marker.id}`} 
            position={[marker.lat, marker.lng]}
            icon={marker.type === "job" ? blueIcon : greenIcon}
          >
            <Popup className="rounded-xl font-sans text-stone-900">
              <div className="p-1">
                {marker.type === "job" ? (
                  <>
                    <p className="font-bold text-base mb-1 text-stone-900">{marker.skill_required || marker.skill}</p>
                    <p className="text-sm text-stone-600 font-medium">₹{marker.salary}/day</p>
                    <p className="text-sm text-stone-600 font-medium">{marker.date} • {marker.workers_needed} Workers Needed</p>
                    {marker.description && (
                      <p className="text-sm text-stone-500 italic mt-1 line-clamp-2">{marker.description}</p>
                    )}
                    <p className="text-sm text-stone-600 font-bold mt-2">Contractor: {marker.contractor_name}</p>
                    <button className="mt-3 w-full bg-brand-600 hover:bg-brand-500 text-white font-semibold py-1.5 px-3 rounded-lg text-sm transition-colors shadow">
                      View Job Details
                    </button>
                  </>
                ) : (
                  <>
                    <p className="font-bold text-base mb-1 text-stone-900">{marker.name}</p>
                    <p className="text-sm text-stone-600 font-medium">Skill: {marker.skill}</p>
                    <p className="text-sm text-stone-600 font-medium">Rating: ⭐{marker.rating?.toFixed(1) || "New"}</p>
                    <p className="text-sm text-stone-600 font-medium">Phone: {marker.phone}</p>
                    <button className="mt-3 w-full bg-brand-600 hover:bg-brand-500 text-white font-semibold py-1.5 px-3 rounded-lg text-sm transition-colors shadow">
                      View Profile
                    </button>
                  </>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
