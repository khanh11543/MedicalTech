import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageMeta from '../../components/common/PageMeta';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import prescriptionService, {
  TemplateDTOFE,
  TemplateSaveDTO,
  TemplateItemDTO,
} from '../../services/prescriptionService';
import { useToast } from '../../hooks/useToast';
import { Toast } from '../../components/common';

// ── Empty item helper ─────────────────────────────────────────────────────────
const emptyItem = (): TemplateItemDTO => ({
  medicineName: '',
  defaultDosage: '',
  defaultFrequency: '',
  defaultDuration: '',
  defaultQuantity: undefined,
  unit: '',
  defaultInstructions: '',
  notes: '',
});

// ── Template Form Modal ───────────────────────────────────────────────────────
function TemplateFormModal({
  initial,
  onSave,
  onClose,
  saving,
}: {
  initial?: TemplateDTOFE;
  onSave: (dto: TemplateSaveDTO) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [name, setName] = useState(initial?.templateName ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [diagnosisTemplate, setDiagnosisTemplate] = useState(initial?.diagnosisTemplate ?? '');
  const [notesTemplate, setNotesTemplate] = useState(initial?.notesTemplate ?? '');
  const [followUpDays, setFollowUpDays] = useState<number | ''>(initial?.defaultFollowUpDays ?? '');
  const [items, setItems] = useState<TemplateItemDTO[]>(
    initial?.items?.length
      ? initial.items.map((i) => ({
          medicineName: i.medicineName,
          defaultDosage: i.defaultDosage,
          defaultFrequency: i.defaultFrequency,
          defaultDuration: i.defaultDuration ?? '',
          defaultQuantity: i.defaultQuantity,
          unit: i.unit ?? '',
          defaultInstructions: i.defaultInstructions ?? '',
          notes: i.notes ?? '',
        }))
      : [emptyItem()]
  );
  const [errors, setErrors] = useState<string[]>([]);

  const updateItem = (idx: number, field: keyof TemplateItemDTO, value: string | number | undefined) => {
    setItems((prev) => prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
  };

  const addItem = () => setItems((prev) => [...prev, emptyItem()]);
  const removeItem = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));

  const validate = () => {
    const errs: string[] = [];
    if (!name.trim()) errs.push('Template name is required');
    items.forEach((item, idx) => {
      if (!item.medicineName.trim()) errs.push(`Item ${idx + 1}: medicine name is required`);
      if (!item.defaultDosage.trim()) errs.push(`Item ${idx + 1}: dosage is required`);
      if (!item.defaultFrequency.trim()) errs.push(`Item ${idx + 1}: frequency is required`);
    });
    return errs;
  };

  const submit = () => {
    const errs = validate();
    if (errs.length) {
      setErrors(errs);
      return;
    }
    setErrors([]);
    onSave({
      templateName: name.trim(),
      description: description.trim() || undefined,
      diagnosisTemplate: diagnosisTemplate.trim() || undefined,
      notesTemplate: notesTemplate.trim() || undefined,
      defaultFollowUpDays: followUpDays !== '' ? Number(followUpDays) : undefined,
      items: items.map((item, i) => ({ ...item, itemOrder: i + 1 })),
    });
  };

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'
      onClick={onClose}
    >
      <div
        className='bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto'
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className='px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between'>
          <h2 className='text-lg font-semibold text-gray-800 dark:text-white'>
            {initial ? 'Edit Template' : 'New Template'}
          </h2>
          <button onClick={onClose} className='text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl leading-none'>✕</button>
        </div>

        {/* Form */}
        <div className='px-6 py-4 space-y-4'>
          {errors.length > 0 && (
            <div className='rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 px-4 py-3'>
              {errors.map((e, i) => (
                <p key={i} className='text-xs text-red-600 dark:text-red-400'>{e}</p>
              ))}
            </div>
          )}

          {/* Template info */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='md:col-span-2'>
              <label className='block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1'>
                Template Name <span className='text-red-500'>*</span>
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder='e.g. Common flu treatment'
                className='w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
              />
            </div>
            <div className='md:col-span-2'>
              <label className='block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1'>Description</label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder='Short description of when to use this template'
                className='w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
              />
            </div>
            <div>
              <label className='block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1'>Diagnosis Template</label>
              <input
                value={diagnosisTemplate}
                onChange={(e) => setDiagnosisTemplate(e.target.value)}
                placeholder='Pre-filled diagnosis text'
                className='w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
              />
            </div>
            <div>
              <label className='block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1'>Default Follow-up Days</label>
              <input
                type='number'
                min={1}
                value={followUpDays}
                onChange={(e) => setFollowUpDays(e.target.value ? Number(e.target.value) : '')}
                placeholder='e.g. 7'
                className='w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
              />
            </div>
            <div className='md:col-span-2'>
              <label className='block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1'>Notes Template</label>
              <textarea
                value={notesTemplate}
                onChange={(e) => setNotesTemplate(e.target.value)}
                rows={2}
                placeholder='Pre-filled notes for this template'
                className='w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none'
              />
            </div>
          </div>

          {/* Medication items */}
          <div>
            <div className='flex items-center justify-between mb-2'>
              <p className='text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase'>
                Medications <span className='text-red-500'>*</span>
              </p>
              <button
                onClick={addItem}
                className='text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400'
              >
                + Add Medication
              </button>
            </div>
            <div className='space-y-3'>
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className='rounded-lg border border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-800'
                >
                  <div className='flex items-center justify-between mb-2'>
                    <span className='text-xs font-medium text-gray-500 dark:text-gray-400'>Medication {idx + 1}</span>
                    {items.length > 1 && (
                      <button
                        onClick={() => removeItem(idx)}
                        className='text-xs text-red-500 hover:text-red-700'
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className='grid grid-cols-2 gap-2'>
                    <div className='col-span-2'>
                      <input
                        value={item.medicineName}
                        onChange={(e) => updateItem(idx, 'medicineName', e.target.value)}
                        placeholder='Medicine name *'
                        className='w-full px-3 py-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-400'
                      />
                    </div>
                    <input
                      value={item.defaultDosage}
                      onChange={(e) => updateItem(idx, 'defaultDosage', e.target.value)}
                      placeholder='Dosage *'
                      className='w-full px-3 py-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-400'
                    />
                    <input
                      value={item.defaultFrequency}
                      onChange={(e) => updateItem(idx, 'defaultFrequency', e.target.value)}
                      placeholder='Frequency *'
                      className='w-full px-3 py-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-400'
                    />
                    <input
                      value={item.defaultDuration ?? ''}
                      onChange={(e) => updateItem(idx, 'defaultDuration', e.target.value)}
                      placeholder='Duration (e.g. 7 days)'
                      className='w-full px-3 py-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-400'
                    />
                    <div className='flex gap-2'>
                      <input
                        type='number'
                        min={1}
                        value={item.defaultQuantity ?? ''}
                        onChange={(e) => updateItem(idx, 'defaultQuantity', e.target.value ? Number(e.target.value) : undefined)}
                        placeholder='Qty'
                        className='w-full px-3 py-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-400'
                      />
                      <input
                        value={item.unit ?? ''}
                        onChange={(e) => updateItem(idx, 'unit', e.target.value)}
                        placeholder='Unit'
                        className='w-full px-3 py-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-400'
                      />
                    </div>
                    <input
                      value={item.defaultInstructions ?? ''}
                      onChange={(e) => updateItem(idx, 'defaultInstructions', e.target.value)}
                      placeholder='Instructions (e.g. take after meals)'
                      className='w-full px-3 py-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-400'
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className='px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3'>
          <button
            onClick={onClose}
            className='px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600'
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={saving}
            className='px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {saving ? 'Saving…' : initial ? 'Save Changes' : 'Create Template'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Delete Confirm Modal ──────────────────────────────────────────────────────
function DeleteConfirmModal({
  template,
  onConfirm,
  onClose,
  loading,
}: {
  template: TemplateDTOFE;
  onConfirm: () => void;
  onClose: () => void;
  loading: boolean;
}) {
  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50' onClick={onClose}>
      <div
        className='bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6'
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className='text-base font-semibold text-gray-800 dark:text-white mb-2'>Delete Template</h2>
        <p className='text-sm text-gray-600 dark:text-gray-400'>
          Are you sure you want to delete <strong>{template.templateName}</strong>? This action cannot be undone.
        </p>
        <div className='flex justify-end gap-3 mt-6'>
          <button
            onClick={onClose}
            className='px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600'
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className='px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {loading ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function DoctorPrescriptionsTemplates() {
  const navigate = useNavigate();
  const { toast, showToast, dismissToast } = useToast();

  const [templates, setTemplates] = useState<TemplateDTOFE[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<TemplateDTOFE | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TemplateDTOFE | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await prescriptionService.getDoctorTemplates();
      setTemplates(data);
    } catch {
      showToast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (dto: TemplateSaveDTO) => {
    try {
      setActionLoading(true);
      await prescriptionService.createDoctorTemplate(dto);
      showToast.success('Template created');
      setShowCreate(false);
      await loadTemplates();
    } catch {
      showToast.error('Failed to create template');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdate = async (dto: TemplateSaveDTO) => {
    if (!editTarget) return;
    try {
      setActionLoading(true);
      await prescriptionService.updateDoctorTemplate(editTarget.id, dto);
      showToast.success('Template updated');
      setEditTarget(null);
      await loadTemplates();
    } catch {
      showToast.error('Failed to update template');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setActionLoading(true);
      await prescriptionService.deleteDoctorTemplate(deleteTarget.id);
      showToast.success('Template deleted');
      setDeleteTarget(null);
      await loadTemplates();
    } catch {
      showToast.error('Failed to delete template');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUse = async (template: TemplateDTOFE) => {
    try {
      setActionLoading(true);
      const items = await prescriptionService.applyDoctorTemplate(template.id);
      // Navigate to the create form with pre-filled items from the template.
      // The doctor must still pick a patient and appointment there.
      navigate('/doctor/prescriptions/create', {
        state: {
          diagnosis: template.diagnosisTemplate,
          notes: template.notesTemplate,
          followUpDays: template.defaultFollowUpDays,
          templateItems: items,
          templateName: template.templateName,
        },
      });
    } catch {
      showToast.error('Failed to apply template');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <>
      <PageMeta title='Prescription Templates | Doctor Panel' description='Manage your prescription templates' />
      <PageBreadcrumb pageTitle='Templates' />

      <div className='space-y-6'>
        {/* Info banner */}
        <div className='rounded-2xl border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20 px-6 py-3 text-sm text-amber-800 dark:text-amber-200'>
          Templates are reusable medication lists for common conditions. When you use a template, you can review and adjust everything before signing — templates do not auto-sign.
        </div>

        {/* Header */}
        <div className='rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]'>
          <div className='px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between'>
            <h3 className='text-lg font-semibold text-gray-800 dark:text-white'>
              My Templates
              <span className='ml-2 text-sm font-normal text-gray-500 dark:text-gray-400'>({templates.length})</span>
            </h3>
            <button
              onClick={() => setShowCreate(true)}
              className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium'
            >
              + New Template
            </button>
          </div>

          {/* Grid */}
          <div className='p-6'>
            {loading ? (
              <div className='text-center py-8 text-gray-400 text-sm'>Loading templates…</div>
            ) : templates.length === 0 ? (
              <div className='text-center py-12 text-gray-400'>
                <p className='text-lg mb-2'>No templates yet</p>
                <p className='text-sm'>Create your first template for quick prescription entry.</p>
                <button
                  onClick={() => setShowCreate(true)}
                  className='mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium'
                >
                  + Create Template
                </button>
              </div>
            ) : (
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                {templates.map((t) => (
                  <div
                    key={t.id}
                    className='border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-gray-50 dark:bg-gray-800 flex flex-col gap-3'
                  >
                    {/* Card header */}
                    <div>
                      <h4 className='font-semibold text-gray-900 dark:text-white text-sm'>{t.templateName}</h4>
                      {t.description && (
                        <p className='text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2'>{t.description}</p>
                      )}
                    </div>

                    {/* Meta */}
                    <div className='text-xs text-gray-500 dark:text-gray-400 space-y-0.5'>
                      <p>
                        <span className='font-medium text-gray-700 dark:text-gray-300'>{t.items.length}</span>{' '}
                        medication{t.items.length !== 1 ? 's' : ''}
                        {t.usageCount > 0 && (
                          <> · Used <span className='font-medium text-gray-700 dark:text-gray-300'>{t.usageCount}</span> time{t.usageCount !== 1 ? 's' : ''}</>
                        )}
                      </p>
                      {t.diagnosisTemplate && (
                        <p className='truncate'>
                          <span className='font-medium'>Dx:</span> {t.diagnosisTemplate}
                        </p>
                      )}
                      {t.defaultFollowUpDays && (
                        <p>
                          <span className='font-medium'>Follow-up:</span> {t.defaultFollowUpDays} days
                        </p>
                      )}
                    </div>

                    {/* Medication preview */}
                    <div className='text-xs text-gray-600 dark:text-gray-400 leading-relaxed'>
                      {t.items.slice(0, 3).map((item, i) => (
                        <div key={i} className='truncate'>
                          • {item.medicineName} {item.defaultDosage} – {item.defaultFrequency}
                        </div>
                      ))}
                      {t.items.length > 3 && (
                        <div className='text-gray-400'>+{t.items.length - 3} more…</div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className='flex gap-2 pt-1 mt-auto'>
                      <button
                        onClick={() => handleUse(t)}
                        disabled={actionLoading}
                        className='flex-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
                      >
                        Use Template
                      </button>
                      <button
                        onClick={() => setEditTarget(t)}
                        className='px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteTarget(t)}
                        className='px-3 py-1.5 text-xs font-medium rounded-lg bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40'
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showCreate && (
        <TemplateFormModal
          onSave={handleCreate}
          onClose={() => setShowCreate(false)}
          saving={actionLoading}
        />
      )}
      {editTarget && (
        <TemplateFormModal
          initial={editTarget}
          onSave={handleUpdate}
          onClose={() => setEditTarget(null)}
          saving={actionLoading}
        />
      )}
      {deleteTarget && (
        <DeleteConfirmModal
          template={deleteTarget}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
          loading={actionLoading}
        />
      )}

      <Toast toast={toast} onDismiss={dismissToast} />
    </>
  );
}
