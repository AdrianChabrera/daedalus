import { useState } from 'react';
import styles from '../../styles/CreateBuildScreen.module.css';
import { Save, Upload, FileText, AlertTriangle } from 'lucide-react';
import type { MultiSlot, SelectedComponent, SingleSlot, SlotConfig } from '../../types/CreateBuildTypes';
import { CreateBuildPcComponentPicker } from '../../components/builds/CreateBuildPcComponentPicker';
import { CREATE_BUILD_SLOTS } from '../../consts/CreateBuildConsts';
import { CreteBuildPcComponentsSlotRow } from '../../components/builds/CreateBuildPcComponentsSlotRow';
import { useCreateBuild } from '../../hooks/useCreateBuild';

export default function CreateBuildScreen() {
  const {
      build, name, setName, description, setDescription,
      warnings, saving, handleSelect, removeSingle, removeMulti, handleSave,
    } = useCreateBuild();

  const [pickerSlot, setPickerSlot] = useState<SlotConfig | null>(null);

return (
  <div className={styles.page}>
    <div className="bgGlow" aria-hidden />
    <div className="bgGrid" aria-hidden />

    <div className={styles.inner}>
      <h1 className={styles.pageTitle}>Create a build</h1>

      <div className={styles.columns}>
        <div className={styles.columnLeft}>
          <div className={styles.panel}>
            {CREATE_BUILD_SLOTS.map(slot => {
              const single = slot.multi ? null : (build[slot.key as SingleSlot] as SelectedComponent | null);
              const multi = slot.multi ? (build[slot.key as MultiSlot] as SelectedComponent[]) : [];

              return (
                <CreteBuildPcComponentsSlotRow
                  key={slot.key}
                  slot={slot}
                  single={single}
                  multi={multi}
                  onAssign={() => setPickerSlot(slot)}
                  onRemoveSingle={() => removeSingle(slot.key as SingleSlot)}
                  onRemoveMulti={(id) => removeMulti(slot.key as MultiSlot, id)}
                />
              );
            })}
          </div>
        </div>

        <div className={styles.columnRight}>

          <div className={styles.compatPanel}>
            <div className={styles.compatHeader}>
              <span className={styles.compatHeaderTitle}>Compatibility</span>
            </div>
            <div className={styles.compatBody}>
              <p className={styles.compatEmpty}>No issues detected.</p>
            </div>
          </div>

          {warnings.length > 0 && (
            <div className={styles.warningBox}>
              <AlertTriangle size={16} className={styles.warningIcon} />
              <div className={styles.warningMessages}>
                {warnings.map((w, i) => <p key={i}>{w}</p>)}
              </div>
            </div>
          )}

          <div className={styles.metaPanel}>
            <div className={styles.metaField}>
              <label className={styles.metaLabel} htmlFor="build-title">Title</label>
              <input
                id="build-title"
                className={styles.metaInput}
                placeholder="Add a title"
                value={name}
                onChange={e => setName(e.target.value)}
                maxLength={255}
              />
            </div>
            <div className={styles.metaField}>
              <label className={styles.metaLabel} htmlFor="build-desc">Description</label>
              <textarea
                id="build-desc"
                className={styles.metaTextarea}
                placeholder="Describe your build…"
                value={description}
                onChange={e => setDescription(e.target.value)}
                maxLength={1000}
                rows={5}
              />
            </div>
          </div>

          <div className={styles.actions}>
            <button className={styles.actionBtnSecondary} disabled aria-label="Export to PDF — not yet implemented">
              <FileText size={16} />
              Export to pdf
            </button>
            <button
              className={styles.actionBtnPrimary}
              onClick={() => handleSave()}
              disabled={saving}
            >
              {saving ? <span className={styles.spinner} /> : <Save size={16} />}
              Save build
            </button>
            <button
              className={styles.actionBtnAccent}
              disabled
              aria-label="Publish build — not yet implemented"
            >
              <Upload size={16} />
              Publish build
            </button>
          </div>

        </div>
      </div>
    </div>

    {pickerSlot && (
      <CreateBuildPcComponentPicker
        slot={pickerSlot}
        onSelect={(comp) => {
          handleSelect(pickerSlot, comp)
          setPickerSlot(null);
        }}
        onClose={() => setPickerSlot(null)}
      />
    )}
  </div>
);
}