"use client";

import React, {
  forwardRef,
  type FormEvent,
} from "react";

export type BodyMetricsFormStyles = {
  form: React.CSSProperties;
  field: React.CSSProperties;
  label: React.CSSProperties;
  input: React.CSSProperties;
  inputWrapper: React.CSSProperties;
  inputWithUnit: React.CSSProperties;
  unit: React.CSSProperties;
  bmrUnit: React.CSSProperties;
  notesField: React.CSSProperties;
  textarea: React.CSSProperties;
  saveArea: React.CSSProperties;
  saveButton: React.CSSProperties;
};

type BodyMetricsFormProps = {
  assessmentDate: string;
  weightKg: string;
  bodyFat: string;
  muscleMass: string;
  visceralFat: string;
  waterPercent: string;
  bmr: string;
  notes: string;
  saving: boolean;

  onAssessmentDateChange: (value: string) => void;
  onWeightKgChange: (value: string) => void;
  onBodyFatChange: (value: string) => void;
  onMuscleMassChange: (value: string) => void;
  onVisceralFatChange: (value: string) => void;
  onWaterPercentChange: (value: string) => void;
  onBmrChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;

  styles: BodyMetricsFormStyles;
};

const BodyMetricsForm = forwardRef<
  HTMLFormElement,
  BodyMetricsFormProps
>(function BodyMetricsForm(
  {
    assessmentDate,
    weightKg,
    bodyFat,
    muscleMass,
    visceralFat,
    waterPercent,
    bmr,
    notes,
    saving,
    onAssessmentDateChange,
    onWeightKgChange,
    onBodyFatChange,
    onMuscleMassChange,
    onVisceralFatChange,
    onWaterPercentChange,
    onBmrChange,
    onNotesChange,
    onSubmit,
    styles,
  },
  ref
) {
  return (
    <form
      ref={ref}
      onSubmit={onSubmit}
      style={styles.form}
    >
      <label style={styles.field}>
        <span style={styles.label}>
          Data da avaliação
        </span>

        <input
          type="date"
          value={assessmentDate}
          onChange={(event) =>
            onAssessmentDateChange(event.target.value)
          }
          disabled={saving}
          style={styles.input}
        />
      </label>

      <MetricWithUnit
        label="Peso"
        value={weightKg}
        placeholder="Ex.: 82,5"
        unit="kg"
        saving={saving}
        onChange={onWeightKgChange}
        styles={styles}
      />

      <MetricWithUnit
        label="Gordura corporal"
        value={bodyFat}
        placeholder="Ex.: 18,7"
        unit="%"
        saving={saving}
        onChange={onBodyFatChange}
        styles={styles}
      />

      <MetricWithUnit
        label="Massa muscular"
        value={muscleMass}
        placeholder="Ex.: 38,2"
        unit="kg"
        saving={saving}
        onChange={onMuscleMassChange}
        styles={styles}
      />

      <label style={styles.field}>
        <span style={styles.label}>
          Gordura visceral
        </span>

        <input
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={visceralFat}
          onChange={(event) =>
            onVisceralFatChange(event.target.value)
          }
          placeholder="Ex.: 6"
          disabled={saving}
          style={styles.input}
        />
      </label>

      <MetricWithUnit
        label="Água corporal"
        value={waterPercent}
        placeholder="Ex.: 58,1"
        unit="%"
        saving={saving}
        onChange={onWaterPercentChange}
        styles={styles}
      />

      <label style={styles.field}>
        <span style={styles.label}>
          Metabolismo basal
        </span>

        <div style={styles.inputWrapper}>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={bmr}
            onChange={(event) =>
              onBmrChange(event.target.value)
            }
            placeholder="Ex.: 1834"
            disabled={saving}
            style={styles.inputWithUnit}
          />

          <span style={styles.bmrUnit}>
            kcal
          </span>
        </div>
      </label>

      <label style={styles.notesField}>
        <span style={styles.label}>
          Observações
        </span>

        <textarea
          value={notes}
          onChange={(event) =>
            onNotesChange(event.target.value)
          }
          placeholder="Informações adicionais do laudo ou da avaliação."
          disabled={saving}
          rows={4}
          style={styles.textarea}
        />
      </label>

      <div style={styles.saveArea}>
        <button
          type="submit"
          disabled={saving}
          style={{
            ...styles.saveButton,
            opacity: saving ? 0.5 : 1,
            cursor: saving
              ? "not-allowed"
              : "pointer",
          }}
        >
          {saving
            ? "Salvando..."
            : "Salvar avaliação"}
        </button>
      </div>
    </form>
  );
});

export default BodyMetricsForm;

function MetricWithUnit({
  label,
  value,
  placeholder,
  unit,
  saving,
  onChange,
  styles,
}: {
  label: string;
  value: string;
  placeholder: string;
  unit: string;
  saving: boolean;
  onChange: (value: string) => void;
  styles: BodyMetricsFormStyles;
}) {
  return (
    <label style={styles.field}>
      <span style={styles.label}>
        {label}
      </span>

      <div style={styles.inputWrapper}>
        <input
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          placeholder={placeholder}
          disabled={saving}
          style={styles.inputWithUnit}
        />

        <span style={styles.unit}>
          {unit}
        </span>
      </div>
    </label>
  );
}
