import { useEffect, useState } from "react";
import { CENTRES, HOME_LANGUAGES } from "../lib/defaults";
import { Modal } from "./Modal";

export interface NewLearnerInput {
  enrolledStd: number;
  centre: string;
  homeLanguage: string;
  consent: boolean;
}

export function AddLearnerModal({
  open,
  defaultCentre,
  onClose,
  onAdded,
}: {
  open: boolean;
  defaultCentre: string;
  onClose: () => void;
  onAdded: (input: NewLearnerInput) => void;
}) {
  const [form, setForm] = useState<NewLearnerInput>({
    enrolledStd: 1,
    centre: defaultCentre || CENTRES[0],
    homeLanguage: "Kannada",
    consent: false,
  });

  useEffect(() => {
    if (open) {
      setForm((value) => ({
        ...value,
        centre: value.centre || defaultCentre || CENTRES[0],
        consent: false,
      }));
    }
  }, [open, defaultCentre]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add a learner"
      description="The app creates an anonymous code. It does not collect a name, photo or date of birth."
      footer={
        <>
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="add-learner-form" className="btn btn-primary" disabled={!form.consent}>
            Add learner
          </button>
        </>
      }
    >
      <form
        id="add-learner-form"
        className="stack-16"
        onSubmit={(event) => {
          event.preventDefault();
          if (!form.consent) return;
          onAdded(form);
        }}
      >
        <div className="field-grid">
          <div className="field">
            <label htmlFor="new-std">Enrolled standard</label>
            <select
              id="new-std"
              className="select"
              value={form.enrolledStd}
              onChange={(event) =>
                setForm((value) => ({ ...value, enrolledStd: Number(event.target.value) }))
              }
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((std) => (
                <option key={std} value={std}>
                  Std {std}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="new-centre">Centre</label>
            <select
              id="new-centre"
              className="select"
              value={form.centre}
              onChange={(event) => setForm((value) => ({ ...value, centre: event.target.value }))}
            >
              {CENTRES.map((centre) => (
                <option key={centre} value={centre}>
                  {centre}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="field">
          <label htmlFor="new-language">Home language</label>
          <select
            id="new-language"
            className="select"
            value={form.homeLanguage}
            onChange={(event) => setForm((value) => ({ ...value, homeLanguage: event.target.value }))}
          >
            {HOME_LANGUAGES.map((language) => (
              <option key={language} value={language}>
                {language}
              </option>
            ))}
          </select>
        </div>
        <label className="check-row">
          <input
            type="checkbox"
            checked={form.consent}
            onChange={(event) => setForm((value) => ({ ...value, consent: event.target.checked }))}
          />
          <span>
            A guardian or centre coordinator has given consent for this learner to take part. Consent is
            recorded as a yes/no flag, not as a document.
          </span>
        </label>
        {!form.consent ? (
          <p className="tiny muted">The add button stays disabled until consent is confirmed.</p>
        ) : null}
      </form>
    </Modal>
  );
}
