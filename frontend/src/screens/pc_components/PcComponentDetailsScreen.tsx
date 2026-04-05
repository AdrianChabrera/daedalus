import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, HelpCircle, Heart, Plus, PenLine } from 'lucide-react';
import { API_ROUTES } from '../../config/api';
import type { PcComponent } from '../../types/PcComponents.types';
import styles from '../../styles/PcComponentDetailsScreen.module.css';
import type { AttrDef } from '../../types/PcComponentDetails.types';

const bool = (v: unknown) => (v === true ? 'Yes' : v === false ? 'No' : '—');
const num = (v: unknown) => (v != null ? String(v) : '—');
const str = (v: unknown) => (v != null && v !== '' ? String(v) : '—');
const arr = (v: unknown) =>
  Array.isArray(v) && v.length > 0 ? (v as string[]).join('\n') : '—';
const ghz = (v: unknown) => (v != null ? `${v} GHz` : '—');
const mb = (v: unknown) => (v != null ? `${v} MB` : '—');
const gb = (v: unknown) => (v != null ? `${v} GB` : '—');
const w = (v: unknown) => (v != null ? `${v} W` : '—');
const mm = (v: unknown) => (v != null ? `${v} mm` : '—');
const rpm = (v: unknown) => (v != null ? `${v} RPM` : '—');
const db = (v: unknown) => (v != null ? `${v} dB` : '—');
const mhz = (v: unknown) => (v != null ? `${v} MHz` : '—');
const hz = (v: unknown) => (v != null ? `${v} Hz` : '—');
const ms = (v: unknown) => (v != null ? `${v} ms` : '—');
const inch = (v: unknown) => (v != null ? `${v}"` : '—');
const kg = (v: unknown) => (v != null ? `${v} kg` : '—');
const liter = (v: unknown) => (v != null ? `${v} L` : '—');
const cfm = (v: unknown) => (v != null ? `${v} CFM` : '—');
const mmhgo = (v: unknown) => (v != null ? `${v} mmH₂O` : '—');
const v_ = (v: unknown) => (v != null ? `${v} V` : '—');

const BASE_ATTRS: AttrDef[] = [
  { key: 'manufacturer', label: 'Manufacturer', format: str },
  { key: 'series', label: 'Series', format: str },
  { key: 'variant', label: 'Variant', format: str },
  { key: 'releaseYear', label: 'Release Year', format: num },
];

const COMPONENT_ATTRS: Record<string, AttrDef[]> = {
  cpu: [
    ...BASE_ATTRS,
    { key: 'socket', label: 'Socket', format: str },
    { key: 'coreCount', label: 'Total Cores', format: num },
    { key: 'threadCount', label: 'Threads', format: num },
    { key: 'baseClock', label: 'Base Clock', format: ghz },
    { key: 'boostClock', label: 'Boost Clock', format: ghz },
    { key: 'tdp', label: 'TDP', format: w },
    { key: 'microarchitecture', label: 'Microarchitecture', format: str },
    { key: 'coreFamily', label: 'Core Family', format: str },
    { key: 'integratedGraphics', label: 'Integrated Graphics', format: str },
    { key: 'cachel1', label: 'Cache L1', format: str },
    { key: 'cachel2', label: 'Cache L2', format: mb },
    { key: 'cachel3', label: 'Cache L3', format: mb },
    { key: 'maxSupportedMemory', label: 'Max Supported Memory', format: gb },
    { key: 'supportedMemoryTypes', label: 'Supported Memory Types', format: arr },
    { key: 'eccSupport', label: 'ECC Support', format: bool },
    { key: 'includesCooler', label: 'Includes Cooler', format: bool },
    { key: 'simultaneousMultithreading', label: 'Simultaneous Multithreading', format: bool },
  ],
  gpu: [
    ...BASE_ATTRS,
    { key: 'chipset', label: 'Chipset', format: str },
    { key: 'memory', label: 'Memory', format: gb },
    { key: 'memoryType', label: 'Memory Type', format: str },
    { key: 'memoryBus', label: 'Memory Bus', format: (v) => (v != null ? `${v}-bit` : '—') },
    { key: 'coreBaseClock', label: 'Core Base Clock', format: ghz },
    { key: 'coreBoostClock', label: 'Core Boost Clock', format: ghz },
    { key: 'effectiveMemoryClock', label: 'Effective Memory Clock', format: ghz },
    { key: 'tdp', label: 'TDP', format: w },
    { key: 'length', label: 'Length', format: mm },
    { key: 'gpuInterface', label: 'Interface', format: str },
    { key: 'pcie6Pin', label: 'PCIe 6-pin Connectors', format: num },
    { key: 'pcie8Pin', label: 'PCIe 8-pin Connectors', format: num },
    { key: 'pcie12VHPWR', label: 'PCIe 12VHPWR Connectors', format: num },
    { key: 'pcie12V2x6', label: 'PCIe 12V-2x6 Connectors', format: num },
    { key: 'hdmi21', label: 'HDMI 2.1 Outputs', format: num },
    { key: 'hdmi20', label: 'HDMI 2.0 Outputs', format: num },
    { key: 'displayPort21', label: 'DisplayPort 2.1 Outputs', format: num },
    { key: 'displayPort21a', label: 'DisplayPort 2.1a Outputs', format: num },
    { key: 'displayPort14a', label: 'DisplayPort 1.4a Outputs', format: num },
    { key: 'dvid', label: 'DVI-D Outputs', format: num },
    { key: 'vga', label: 'VGA Outputs', format: num },
  ],
  motherboard: [
    ...BASE_ATTRS,
    { key: 'socket', label: 'Socket', format: str },
    { key: 'chipset', label: 'Chipset', format: str },
    { key: 'formFactor', label: 'Form Factor', format: str },
    { key: 'ramType', label: 'RAM Type', format: str },
    { key: 'maxMemory', label: 'Max Memory', format: gb },
    { key: 'memorySlots', label: 'Memory Slots', format: num },
    { key: 'sata6GbSPorts', label: 'SATA 6 Gb/s Ports', format: num },
    { key: 'sata3GbSPorts', label: 'SATA 3 Gb/s Ports', format: num },
    { key: 'u2Ports', label: 'U.2 Ports', format: num },
    { key: 'm2SlotCount', label: 'M.2 Slots', format: num },
    { key: 'pcieSlotCount', label: 'PCIe Slots', format: num },
    { key: 'usb20Headers', label: 'USB 2.0 Headers', format: num },
    { key: 'usb32Gen1Headers', label: 'USB 3.2 Gen 1 Headers', format: num },
    { key: 'usb32Gen2Headers', label: 'USB 3.2 Gen 2 Headers', format: num },
    { key: 'usb32Gen2x2Headers', label: 'USB 3.2 Gen 2×2 Headers', format: num },
    { key: 'usb4Headers', label: 'USB 4 Headers', format: num },
    { key: 'onboardEthernet', label: 'Onboard Ethernet', format: str },
    { key: 'wirelessNetworking', label: 'Wireless Networking', format: str },
    { key: 'audio', label: 'Audio', format: str },
    { key: 'backPanelPorts', label: 'Back Panel Ports', format: arr },
    { key: 'biosFlashback', label: 'BIOS Flashback', format: bool },
    { key: 'biosClearCmos', label: 'BIOS Clear CMOS', format: bool },
    { key: 'eccSupport', label: 'ECC Support', format: bool },
    { key: 'raidSupport', label: 'RAID Support', format: bool },
    { key: 'backConnect', label: 'Back Connect', format: bool },
  ],
  ram: [
    ...BASE_ATTRS,
    { key: 'memoryType', label: 'Memory Type', format: str },
    { key: 'formFactor', label: 'Form Factor', format: str },
    { key: 'quantity', label: 'Quantity', format: num },
    { key: 'capacity', label: 'Capacity per Module', format: gb },
    { key: 'speed', label: 'Speed', format: mhz },
    { key: 'casLatency', label: 'CAS Latency', format: (v) => (v != null ? `CL${v}` : '—') },
    { key: 'timings', label: 'Timings', format: str },
    { key: 'voltage', label: 'Voltage', format: v_ },
    { key: 'heatSpreader', label: 'Heat Spreader', format: bool },
    { key: 'rgb', label: 'RGB', format: bool },
    { key: 'ecc', label: 'ECC', format: bool },
  ],
  'storage-drive': [
    ...BASE_ATTRS,
    { key: 'storageType', label: 'Type', format: str },
    { key: 'formFactor', label: 'Form Factor', format: str },
    { key: 'storageInterface', label: 'Interface', format: str },
    { key: 'capacity', label: 'Capacity', format: gb },
    { key: 'nvme', label: 'NVMe', format: bool },
  ],
  'cpu-cooler': [
    ...BASE_ATTRS,
    { key: 'waterCooled', label: 'Water Cooled', format: bool },
    { key: 'fanless', label: 'Fanless', format: bool },
    { key: 'fanSize', label: 'Fan Size', format: mm },
    { key: 'fanQuantity', label: 'Fan Quantity', format: num },
    { key: 'minFanRpm', label: 'Min Fan RPM', format: rpm },
    { key: 'maxFanRpm', label: 'Max Fan RPM', format: rpm },
    { key: 'minNoiseLevel', label: 'Min Noise Level', format: db },
    { key: 'maxNoiseLevel', label: 'Max Noise Level', format: db },
    { key: 'height', label: 'Height', format: mm },
    { key: 'radiatorSize', label: 'Radiator Size', format: mm },
    { key: 'supportedSockets', label: 'Supported Sockets', format: arr },
  ],
  case: [
    ...BASE_ATTRS,
    { key: 'formFactor', label: 'Form Factor', format: str },
    { key: 'supportedMotherboardFormFactors', label: 'Supported Motherboard Form Factors', format: arr },
    { key: 'width', label: 'Width', format: mm },
    { key: 'height', label: 'Height', format: mm },
    { key: 'depth', label: 'Depth', format: mm },
    { key: 'volume', label: 'Volume', format: liter },
    { key: 'weight', label: 'Weight', format: kg },
    { key: 'maxVideoCardLength', label: 'Max GPU Length', format: mm },
    { key: 'maxCpuCoolerHeight', label: 'Max CPU Cooler Height', format: mm },
    { key: 'internal35bays', label: 'Internal 3.5" Bays', format: num },
    { key: 'internal25bays', label: 'Internal 2.5" Bays', format: num },
    { key: 'expansionSlots', label: 'Expansion Slots', format: num },
    { key: 'riserExpansionSlots', label: 'Riser Expansion Slots', format: num },
    { key: 'sidePanel', label: 'Side Panel', format: str },
    { key: 'powerSupply', label: 'Included PSU', format: str },
    { key: 'powerSupplyShroud', label: 'PSU Shroud', format: bool },
    { key: 'frontUsbPorts', label: 'Front USB Ports', format: arr },
  ],
  'power-supply': [
    ...BASE_ATTRS,
    { key: 'formFactor', label: 'Form Factor', format: str },
    { key: 'wattage', label: 'Wattage', format: w },
    { key: 'efficencyRating', label: 'Efficiency Rating', format: str },
    { key: 'modular', label: 'Modular', format: str },
    { key: 'fanless', label: 'Fanless', format: bool },
    { key: 'length', label: 'Length', format: mm },
    { key: 'atx24Pin', label: 'ATX 24-pin Connectors', format: num },
    { key: 'eps8Pin', label: 'EPS 8-pin Connectors', format: num },
    { key: 'pcie12Vhpwr', label: 'PCIe 12VHPWR Connectors', format: num },
    { key: 'pcie6Plus2Pin', label: 'PCIe 6+2-pin Connectors', format: num },
    { key: 'sata', label: 'SATA Connectors', format: num },
  ],
  fan: [
    ...BASE_ATTRS,
    { key: 'quantity', label: 'Quantity', format: num },
    { key: 'size', label: 'Size', format: mm },
    { key: 'connector', label: 'Connector', format: str },
    { key: 'controller', label: 'Controller', format: str },
    { key: 'led', label: 'LED', format: str },
    { key: 'flowDirection', label: 'Flow Direction', format: str },
    { key: 'pwm', label: 'PWM', format: bool },
    { key: 'minNoiseLevel', label: 'Min Noise Level', format: db },
    { key: 'maxNoiseLevel', label: 'Max Noise Level', format: db },
    { key: 'minAirflow', label: 'Min Airflow', format: cfm },
    { key: 'maxAirflow', label: 'Max Airflow', format: cfm },
    { key: 'staticPressure', label: 'Static Pressure', format: mmhgo },
  ],
  monitor: [
    ...BASE_ATTRS,
    { key: 'screenSize', label: 'Screen Size', format: inch },
    { key: 'panelType', label: 'Panel Type', format: str },
    { key: 'horizontalRes', label: 'Horizontal Resolution', format: (v) => (v != null ? `${v}px` : '—') },
    { key: 'verticalRes', label: 'Vertical Resolution', format: (v) => (v != null ? `${v}px` : '—') },
    { key: 'aspectRatio', label: 'Aspect Ratio', format: str },
    { key: 'refreshRate', label: 'Refresh Rate', format: hz },
    { key: 'responseTime', label: 'Response Time', format: ms },
    { key: 'maxBrightness', label: 'Max Brightness', format: str },
    { key: 'adaptiveSync', label: 'Adaptive Sync', format: str },
    { key: 'connectors', label: 'Connectors', format: str },
  ],
  keyboard: [...BASE_ATTRS],
  mouse: [...BASE_ATTRS],
};

interface M2SlotData {
  id: number;
  size: string | null;
  key: string | null;
  m2Interface: string | null;
}

interface PcieSlotData {
  id: number;
  gen: string | null;
  quantity: number | null;
  lanes: number | null;
}

function ImagePlaceholder() {
  return (
    <div>TODO Add placeholder</div>
  );
}

export default function ComponentDetailScreen() {
  const { type, id } = useParams<{ type: string; id: string }>();
  const navigate = useNavigate();

  const [component, setComponent] = useState<PcComponent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!type || !id) return;
    let cancelled = false;

    const fetchComponent = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(API_ROUTES.COMPONENT(type, id));
        if (!res.ok) throw new Error(`Error ${res.status}`);
        const data: PcComponent = await res.json();
        if (!cancelled) setComponent(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Unexpected error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchComponent();
    return () => { cancelled = true; };
  }, [type, id]);

  const attrs = type ? (COMPONENT_ATTRS[type] ?? BASE_ATTRS) : BASE_ATTRS;

  const availableLogos = import.meta.glob('../../assets/logos/*.svg', { eager: true });
  const manufacturerName = component?.manufacturer ? component.manufacturer.toLowerCase() : '';
  const route = `../../assets/logos/${manufacturerName}.svg`;
  const logoExists = !!availableLogos[route];
  const logo = logoExists
    ? new URL(route, import.meta.url).href
    : undefined; 

  const m2Slots: M2SlotData[] = (component as (PcComponent & { m2Slots?: M2SlotData[] }) | null)?.m2Slots ?? [];
  const pcieSlots: PcieSlotData[] = (component as (PcComponent & { pcieSlots?: PcieSlotData[] }) | null)?.pcieSlots ?? [];

  return (
    <div className={styles.page}>
      <div className="bgGlow" aria-hidden />
      <div className="bgGrid" aria-hidden />

      <div className={styles.inner}>

        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          <ArrowLeft size={15} />
          Back to components
        </button>

        {loading && (
          <div className={styles.loadingState}>
            <div className={styles.spinner} />
          </div>
        )}

        {error && (
          <div className={styles.errorState}>
            <p className={styles.errorText}>Could not load component: {error}</p>
          </div>
        )}

        {!loading && !error && component && (
          <>
            <div className={styles.hero}>
              <div className={styles.heroImage}>
                {logoExists ? (
                  <img src={logo} alt={component.manufacturer ?? ''} className={styles.heroLogo} />
                ) : (
                  <ImagePlaceholder />
                )}
              </div>

              <div className={styles.heroInfo}>
                <h1 className={styles.heroTitle}>{component.name ?? '—'}</h1>

                <div className={styles.ratingContainer} aria-label="Rating — not yet implemented">
                  <div className={styles.starsPlaceholder}>
                    {[1, 2, 3, 4, 5].map(i => (
                      <span key={i} className={styles.starEmpty}>★</span>
                    ))}
                  </div>
                </div>

                <div className={styles.heroActions}>
                  <button
                    className={styles.favouriteBtn}
                    disabled
                    aria-label="Add to favourites — not yet implemented"
                  >
                    <Heart size={18} />
                  </button>

                  <button
                    className={styles.addToBuildBtn}
                    disabled
                    aria-label="Add to build — not yet implemented"
                  >
                    <Plus size={16} />
                    Add to build
                  </button>
                </div>
              </div>
            </div>

            <div className={styles.mainContent}>

              <section className={styles.techSection}>
                <h2 className={styles.sectionTitle}>Technical details</h2>

                <table className={styles.attrTable}>
                  <tbody>
                    {attrs.map(({ key, label, format }) => {
                      const raw = component[key];
                      const display = format ? format(raw) : str(raw);
                      return (
                        <tr key={key} className={styles.attrRow}>
                          <td className={styles.attrLabel}>
                            <span className={styles.attrLabelText}>{label}</span>
                            <span className={styles.helpIcon} aria-hidden>
                              <HelpCircle size={12} />
                            </span>
                          </td>
                          <td className={styles.attrValue}>{display}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {type === 'motherboard' && m2Slots.length > 0 && (
                  <div className={styles.subTableWrapper}>
                    <h3 className={styles.subTableTitle}>M.2 Slots</h3>
                    <table className={styles.subTable}>
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Size</th>
                          <th>Key</th>
                          <th>Interface</th>
                        </tr>
                      </thead>
                      <tbody>
                        {m2Slots.map((slot, i) => (
                          <tr key={slot.id}>
                            <td>{i + 1}</td>
                            <td>{slot.size ?? '—'}</td>
                            <td>{slot.key ?? '—'}</td>
                            <td>{slot.m2Interface ?? '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {type === 'motherboard' && pcieSlots.length > 0 && (
                  <div className={styles.subTableWrapper}>
                    <h3 className={styles.subTableTitle}>PCIe Slots</h3>
                    <table className={styles.subTable}>
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Gen</th>
                          <th>Lanes</th>
                          <th>Quantity</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pcieSlots.map((slot, i) => (
                          <tr key={slot.id}>
                            <td>{i + 1}</td>
                            <td>{slot.gen ?? '—'}</td>
                            <td>{slot.lanes != null ? `×${slot.lanes}` : '—'}</td>
                            <td>{slot.quantity ?? '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <section className={styles.reviewsSection}>
                <div className={styles.reviewsHeader}>
                  <h2 className={styles.sectionTitle}>Reviews</h2>

                  <button
                    className={styles.writeReviewBtn}
                    disabled
                    aria-label="Write a review — not yet implemented"
                  >
                    <PenLine size={14} />
                    Write a review
                  </button>
                </div>

                <div className={styles.reviewsPlaceholder}>
                  <p className={styles.reviewsEmpty}>No reviews yet.</p>
                </div>
              </section>

            </div>
          </>
        )}
      </div>
    </div>
  );
}