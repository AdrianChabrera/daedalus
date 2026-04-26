import { useState } from 'react';
import styles from '../../styles/CreateBuildScreen.module.css';
import { Save, Upload, FileText, AlertTriangle } from 'lucide-react';
import type { MultiSlot, SelectedComponent, SingleSlot, SlotConfig } from '../../types/CreateBuildTypes';
import { CreateBuildPcComponentPicker } from '../../components/builds/CreateBuildPcComponentPicker';
import { CREATE_BUILD_SLOTS } from '../../consts/CreateBuildConsts';
import { CreteBuildPcComponentsSlotRow } from '../../components/builds/CreateBuildPcComponentsSlotRow';
import { useCreateBuild } from '../../hooks/useCreateBuild';
import { useCompatibility } from '../../hooks/useCompatibility';
import { CompatibilityPanel } from '../../components/builds/CompatibilityPanel';
import ConfirmModal from '../../components/general/ConfirmModal';

export default function CreateBuildScreen() {
  const {
    build, populated, name, setName, description, setDescription,
    warnings, saving, handleSelect, removeSingle, removeMulti, 
    changeQuantity, handleSave, handleSaveAndPublish,
  } = useCreateBuild();

  const { issues, loading: compatLoading, error: compatError } = useCompatibility(build);

  const [pickerSlot, setPickerSlot] = useState<SlotConfig | null>(null);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);

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
                const singleId = slot.multi ? null : (build[slot.key as SingleSlot] as string | null);
                const single = singleId && populated[singleId] ? populated[singleId] : null;

                const multiEntries = slot.multi ? build[slot.key as MultiSlot] : [];
                const multi = multiEntries
                  .map(entry => populated[entry.componentId])
                  .filter((comp): comp is SelectedComponent => comp !== undefined);

                return (
                  <CreteBuildPcComponentsSlotRow
                    key={slot.key}
                    slot={slot}
                    single={single}
                    multi={multi}
                    multiEntries={multiEntries}
                    onAssign={() => setPickerSlot(slot)}
                    onRemoveSingle={() => removeSingle(slot.key as SingleSlot)}
                    onRemoveMulti={(id) => removeMulti(slot.key as MultiSlot, id)}
                    onQuantityChange={(id, qty) => changeQuantity(slot.key as MultiSlot, id, qty)}
                  />
                );
              })}
            </div>
          </div>

          <div className={styles.columnRight}>

            <CompatibilityPanel
              issues={issues}
              loading={compatLoading}
              error={compatError}
            />

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

            {warnings.length > 0 && (
              <div className={styles.warningBox}>
                <AlertTriangle size={16} className={styles.warningIcon} />
                <div className={styles.warningMessages}>
                  {warnings.map((w, i) => <p key={i}>{w}</p>)}
                </div>
              </div>
            )}

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
                onClick={() => setShowPublishConfirm(true)}
                disabled={saving}
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
            handleSelect(pickerSlot, comp);
            setPickerSlot(null);
          }}
          onClose={() => setPickerSlot(null)}
        />
      )}

      <ConfirmModal
        isOpen={showPublishConfirm}
        loading={saving}
        title="Publish build"
        description={
          <>
            Your build will be <strong>visible to everyone</strong>. Make sure it's ready before publishing.
          </>
        }
        confirmLabel="Publish"
        cancelLabel="Cancel"
        variant="info"
        onConfirm={() => {
          handleSaveAndPublish();
          setShowPublishConfirm(false);
        }}
        onCancel={() => setShowPublishConfirm(false)}
      />
    </div>
  );
}