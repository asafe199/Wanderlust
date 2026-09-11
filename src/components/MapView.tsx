import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { WlEvent } from '../lib/types'

export interface MapHandle {
  flyTo: (lat: number, lng: number, zoom?: number) => void
  getCenter: () => { lat: number; lng: number }
}

interface Props {
  events: WlEvent[]
  /** Events outside the active filters — drawn dimmed, still tappable. */
  dimmedIds?: string[]
  selectedId?: string | null
  center: [number, number]
  zoom?: number
  onSelect?: (id: string) => void
  /** Pin-drop mode for the create-event flow. */
  pickMode?: boolean
  pickAt?: [number, number] | null
  onPick?: (lat: number, lng: number) => void
  /** Tapping empty map dismisses the current selection. */
  onBackgroundClick?: () => void
  userLocation?: [number, number] | null
  interactive?: boolean
  onReady?: (handle: MapHandle) => void
}

const CLUSTER_RADIUS_PX = 64

export default function MapView({
  events,
  dimmedIds = [],
  selectedId,
  center,
  zoom = 13,
  onSelect,
  pickMode = false,
  pickAt = null,
  onPick,
  userLocation = null,
  interactive = true,
  onBackgroundClick,
  onReady,
}: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const layerRef = useRef<L.LayerGroup | null>(null)
  const propsRef = useRef({ events, dimmedIds, selectedId, onSelect, pickMode, pickAt, userLocation })
  propsRef.current = { events, dimmedIds, selectedId, onSelect, pickMode, pickAt, userLocation }

  /* ---- create the map once ---- */
  useEffect(() => {
    if (!hostRef.current || mapRef.current) return
    const map = L.map(hostRef.current, {
      center,
      zoom,
      zoomControl: false,
      attributionControl: true,
      dragging: interactive,
      scrollWheelZoom: interactive,
      doubleClickZoom: interactive,
      touchZoom: interactive,
      keyboard: interactive,
    })
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap',
    }).addTo(map)
    layerRef.current = L.layerGroup().addTo(map)
    mapRef.current = map
    map.on('zoomend moveend', () => draw())
    onReady?.({
      flyTo: (lat, lng, z) => map.flyTo([lat, lng], z ?? map.getZoom(), { duration: 0.7 }),
      getCenter: () => map.getCenter(),
    })
    // Leaflet needs a nudge when it mounts inside a freshly laid-out flex box.
    window.setTimeout(() => map.invalidateSize(), 80)
    draw()
    return () => {
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ---- pick-mode click handling ---- */
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const handler = (e: L.LeafletMouseEvent) => {
      if (propsRef.current.pickMode) onPick?.(e.latlng.lat, e.latlng.lng)
      else onBackgroundClick?.()
    }
    map.on('click', handler)
    return () => {
      map.off('click', handler)
    }
  }, [onPick, onBackgroundClick])

  /* ---- keep the viewport in sync with the requested centre ---- */
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const current = map.getCenter()
    const moved =
      Math.abs(current.lat - center[0]) > 0.0005 || Math.abs(current.lng - center[1]) > 0.0005
    if (moved) map.setView(center, zoom, { animate: true })
  }, [center, zoom])

  /* ---- redraw pins whenever the data changes ---- */
  useEffect(() => {
    draw()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events, selectedId, dimmedIds.join(','), pickAt?.[0], pickAt?.[1], userLocation?.[0]])

  function draw() {
    const map = mapRef.current
    const layer = layerRef.current
    if (!map || !layer) return
    layer.clearLayers()

    const {
      events: evts,
      dimmedIds: dimmed,
      selectedId: selected,
      onSelect: select,
      pickMode: picking,
      pickAt: pick,
      userLocation: me,
    } = propsRef.current

    if (me) {
      layer.addLayer(
        L.marker(me, {
          interactive: false,
          icon: L.divIcon({
            className: 'wl-pin',
            iconSize: [22, 22],
            iconAnchor: [11, 11],
            html:
              '<div style="width:22px;height:22px;border-radius:999px;background:#4B32E8;' +
              'border:3px solid #fff;box-shadow:0 4px 12px rgba(75,50,232,.45)"></div>',
          }),
        }),
      )
    }

    if (picking) {
      const at = pick ?? [map.getCenter().lat, map.getCenter().lng]
      layer.addLayer(
        L.marker(at as L.LatLngExpression, {
          draggable: true,
          icon: L.divIcon({
            className: 'wl-pin',
            iconSize: [34, 42],
            iconAnchor: [17, 40],
            html:
              '<svg width="34" height="42" viewBox="0 0 34 42" fill="none">' +
              '<path d="M17 41c0-9 13-14.5 13-24A13 13 0 1 0 4 17c0 9.5 13 15 13 24Z" fill="#4B32E8"/>' +
              '<circle cx="17" cy="16" r="5" fill="#fff"/></svg>',
          }),
        }).on('dragend', (e) => {
          const m = e.target as L.Marker
          const p = m.getLatLng()
          onPick?.(p.lat, p.lng)
        }),
      )
      return
    }

    /* Greedy pixel-space clustering keeps the map readable when events stack up. */
    const zoomNow = map.getZoom()
    const points = evts.map((e) => ({
      event: e,
      point: map.project([e.lat, e.lng], zoomNow),
    }))
    const used = new Set<string>()
    const clusters: { members: WlEvent[]; lat: number; lng: number }[] = []

    for (const a of points) {
      if (used.has(a.event.id)) continue
      const members = [a.event]
      used.add(a.event.id)
      for (const b of points) {
        if (used.has(b.event.id)) continue
        if (a.point.distanceTo(b.point) < CLUSTER_RADIUS_PX) {
          members.push(b.event)
          used.add(b.event.id)
        }
      }
      clusters.push({
        members,
        lat: members.reduce((s, m) => s + m.lat, 0) / members.length,
        lng: members.reduce((s, m) => s + m.lng, 0) / members.length,
      })
    }

    for (const cluster of clusters) {
      if (cluster.members.length > 1 && !cluster.members.some((m) => m.id === selected)) {
        const size = 54
        layer.addLayer(
          L.marker([cluster.lat, cluster.lng], {
            icon: L.divIcon({
              className: 'wl-pin',
              iconSize: [size, size],
              iconAnchor: [size / 2, size / 2],
              html: `<div class="pin-cluster">${cluster.members.length}</div>`,
            }),
            keyboard: false,
          }).on('click', () => map.flyTo([cluster.lat, cluster.lng], Math.min(zoomNow + 2, 17))),
        )
        continue
      }
      for (const event of cluster.members) {
        const isSelected = event.id === selected
        const isDim = dimmed.includes(event.id)
        const size = isSelected ? 80 : 56
        layer.addLayer(
          L.marker([event.lat, event.lng], {
            zIndexOffset: isSelected ? 1000 : 0,
            icon: L.divIcon({
              className: 'wl-pin',
              iconSize: [size, size],
              iconAnchor: [size / 2, size / 2],
              html:
                `<div class="pin-wrap ${isSelected ? 'selected' : ''} ${isDim ? 'dim' : ''}">` +
                `<div class="pin-photo"><img src="${event.cover}" alt=""></div></div>`,
            }),
            title: event.title,
          }).on('click', () => select?.(event.id)),
        )
      }
    }
  }

  return <div className="map" ref={hostRef} role="application" aria-label="Event map" />
}
