import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Upload, X, ImageIcon, Eye } from 'lucide-react';
import CertificatePreview from '../../components/ui/CertificatePreview';

const schema = z.object({
  name:         z.string().min(1, 'Required'),
  layout:       z.enum(['landscape', 'portrait']),
  primaryColor: z.string(),
  accentColor:  z.string(),
  showQR:       z.boolean(),
  showLogo:     z.boolean(),
});
type Form = z.infer<typeof schema>;

export default function NewTemplate() {
  const { organization } = useAuth();
  const orgId = organization?.id ?? '';
  const navigate = useNavigate();

  const [imageFile,    setImageFile]    = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [showPreview,  setShowPreview]  = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { layout: 'landscape', primaryColor: '#112a29', accentColor: '#ddf05c', showQR: true, showLogo: true },
  });

  const primaryColor = watch('primaryColor');
  const accentColor  = watch('accentColor');
  const showQR       = watch('showQR');
  const showLogo     = watch('showLogo');

  function handleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function clearImage() {
    setImageFile(null);
    setImagePreview(null);
  }

  async function onSubmit(data: Form) {
    const { name, ...config } = data;
    const res = await api.post(`/organizations/${orgId}/templates`, { name, configuration: config });
    const template = res.data.data;

    if (imageFile) {
      setUploadingImg(true);
      try {
        const fd = new FormData();
        fd.append('logo', imageFile);
        await api.post(`/organizations/${orgId}/templates/${template.id}/image`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } catch {
        toast.error('Template created but image upload failed. You can re-upload from Edit.');
        navigate('/dashboard/templates');
        return;
      } finally {
        setUploadingImg(false);
      }
    }

    toast.success('Template created.');
    navigate('/dashboard/templates');
  }

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="font-serif text-3xl text-brand-dark mb-2">New Template</h1>
      <p className="text-gray-500 mb-8">Configure how your certificates will look.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="card space-y-5">
        <div>
          <label className="label">Template Name *</label>
          <input className="input" placeholder="e.g. Standard Completion Certificate" {...register('name')} />
          {errors.name && <p className="text-red-600 text-xs mt-1">{errors.name.message}</p>}
        </div>

        <div>
          <label className="label">Layout</label>
          <select className="input" {...register('layout')}>
            <option value="landscape">Landscape (A4)</option>
            <option value="portrait">Portrait (A4)</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Primary Color</label>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                className="h-10 w-14 border border-brand-border cursor-pointer rounded"
                value={primaryColor}
                onChange={e => setValue('primaryColor', e.target.value, { shouldValidate: true })}
              />
              <input
                className="input flex-1"
                {...register('primaryColor')}
                onChange={e => setValue('primaryColor', e.target.value, { shouldValidate: true })}
              />
            </div>
          </div>
          <div>
            <label className="label">Accent Color</label>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                className="h-10 w-14 border border-brand-border cursor-pointer rounded"
                value={accentColor}
                onChange={e => setValue('accentColor', e.target.value, { shouldValidate: true })}
              />
              <input
                className="input flex-1"
                {...register('accentColor')}
                onChange={e => setValue('accentColor', e.target.value, { shouldValidate: true })}
              />
            </div>
          </div>
        </div>

        {/* Live color strip */}
        <div className="rounded overflow-hidden border border-brand-border h-10 flex">
          <div className="w-6 shrink-0" style={{ backgroundColor: primaryColor }} />
          <div className="flex-1"        style={{ backgroundColor: accentColor }} />
          <div className="w-6 shrink-0" style={{ backgroundColor: primaryColor }} />
        </div>

        <div className="flex gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" {...register('showQR')} />
            <span className="text-sm text-gray-600">Include QR code</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" {...register('showLogo')} />
            <span className="text-sm text-gray-600">Include organization logo</span>
          </label>
        </div>

        {/* Custom watermark image */}
        <div>
          <label className="label">Custom Seal / Watermark Image</label>
          <p className="text-xs text-gray-400 mb-2">
            Appears as a faint centred watermark on the certificate. PNG with transparency works best.
          </p>
          {imagePreview ? (
            <div className="flex items-center gap-4 p-3 border border-brand-border rounded-lg bg-brand-cream/40">
              <img src={imagePreview} alt="Preview" className="w-16 h-16 object-contain rounded border border-brand-border bg-white" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-brand-dark truncate">{imageFile?.name}</p>
                <p className="text-xs text-gray-400">{imageFile ? (imageFile.size / 1024).toFixed(0) + ' KB' : ''}</p>
              </div>
              <button type="button" onClick={clearImage} className="text-gray-400 hover:text-red-500 shrink-0">
                <X size={16} />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-brand-border rounded-lg p-6 cursor-pointer hover:border-brand-mid transition-colors bg-brand-cream/20">
              <ImageIcon size={28} className="text-gray-400" />
              <span className="text-sm text-gray-500">Click to select image</span>
              <span className="text-xs text-gray-400">PNG, JPG, SVG — max 2 MB</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleImagePick} />
            </label>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          {/* Preview button */}
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className="btn-secondary flex items-center gap-2 px-4 py-3"
          >
            <Eye size={16} /> Preview
          </button>

          <button
            type="submit"
            disabled={isSubmitting || uploadingImg}
            className="btn-primary flex-1 py-3"
          >
            {isSubmitting ? 'Creating…' : uploadingImg ? 'Uploading image…' : 'Create Template'}
          </button>
          <Link to="/dashboard/templates" className="btn-secondary px-6 py-3">Cancel</Link>
        </div>
      </form>

      {showPreview && (
        <CertificatePreview
          config={{
            primaryColor,
            accentColor,
            showQR,
            showLogo,
            customImageUrl: imagePreview,
          }}
          orgName={organization?.name ?? 'Your Organization'}
          orgLogoUrl={showLogo ? (organization?.logoUrl ?? null) : null}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
}

const schema = z.object({
  name:         z.string().min(1, 'Required'),
  layout:       z.enum(['landscape', 'portrait']),
  primaryColor: z.string(),
  accentColor:  z.string(),
  showQR:       z.boolean(),
  showLogo:     z.boolean(),
});
type Form = z.infer<typeof schema>;

export default function NewTemplate() {
  const { organization } = useAuth();
  const orgId = organization?.id ?? '';
  const navigate = useNavigate();

  // After template is created we get its id so we can upload the custom image
  const [createdId, setCreatedId]         = useState<string | null>(null);
  const [imageFile,   setImageFile]       = useState<File | null>(null);
  const [imagePreview, setImagePreview]   = useState<string | null>(null);
  const [uploadingImg, setUploadingImg]   = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { layout: 'landscape', primaryColor: '#112a29', accentColor: '#ddf05c', showQR: true, showLogo: true },
  });

  const primaryColor = watch('primaryColor');
  const accentColor  = watch('accentColor');

  function handleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function clearImage() {
    setImageFile(null);
    setImagePreview(null);
  }

  async function onSubmit(data: Form) {
    const { name, ...config } = data;
    const res = await api.post(`/organizations/${orgId}/templates`, { name, configuration: config });
    const template = res.data.data;
    setCreatedId(template.id);

    // If an image was selected, upload it immediately after creation
    if (imageFile) {
      setUploadingImg(true);
      try {
        const fd = new FormData();
        fd.append('logo', imageFile); // field name 'logo' — matches uploadLogo multer config
        await api.post(`/organizations/${orgId}/templates/${template.id}/image`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } catch {
        toast.error('Template created but image upload failed. You can re-upload from Edit.');
        navigate('/dashboard/templates');
        return;
      } finally {
        setUploadingImg(false);
      }
    }

    toast.success('Template created.');
    navigate('/dashboard/templates');
  }

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="font-serif text-3xl text-brand-dark mb-2">New Template</h1>
      <p className="text-gray-500 mb-8">Configure how your certificates will look.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="card space-y-5">
        {/* Name */}
        <div>
          <label className="label">Template Name *</label>
          <input className="input" placeholder="e.g. Standard Completion Certificate" {...register('name')} />
          {errors.name && <p className="text-red-600 text-xs mt-1">{errors.name.message}</p>}
        </div>

        {/* Layout */}
        <div>
          <label className="label">Layout</label>
          <select className="input" {...register('layout')}>
            <option value="landscape">Landscape (A4)</option>
            <option value="portrait">Portrait (A4)</option>
          </select>
        </div>

        {/* Colors */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Primary Color</label>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                className="h-10 w-14 border border-brand-border cursor-pointer rounded"
                value={primaryColor}
                onChange={e => setValue('primaryColor', e.target.value, { shouldValidate: true })}
              />
              <input
                className="input flex-1"
                {...register('primaryColor')}
                onChange={e => setValue('primaryColor', e.target.value, { shouldValidate: true })}
              />
            </div>
          </div>
          <div>
            <label className="label">Accent Color</label>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                className="h-10 w-14 border border-brand-border cursor-pointer rounded"
                value={accentColor}
                onChange={e => setValue('accentColor', e.target.value, { shouldValidate: true })}
              />
              <input
                className="input flex-1"
                {...register('accentColor')}
                onChange={e => setValue('accentColor', e.target.value, { shouldValidate: true })}
              />
            </div>
          </div>
        </div>

        {/* Live preview strip */}
        <div className="rounded overflow-hidden border border-brand-border h-10 flex">
          <div className="w-6 shrink-0" style={{ backgroundColor: primaryColor }} />
          <div className="flex-1" style={{ backgroundColor: accentColor }} />
          <div className="w-6 shrink-0" style={{ backgroundColor: primaryColor }} />
        </div>

        {/* Toggles */}
        <div className="flex gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" {...register('showQR')} />
            <span className="text-sm text-gray-600">Include QR code</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" {...register('showLogo')} />
            <span className="text-sm text-gray-600">Include organization logo</span>
          </label>
        </div>

        {/* Custom watermark image */}
        <div>
          <label className="label">Custom Seal / Watermark Image</label>
          <p className="text-xs text-gray-400 mb-2">
            Appears as a faint centred watermark on the certificate. PNG with transparency works best.
          </p>

          {imagePreview ? (
            <div className="flex items-center gap-4 p-3 border border-brand-border rounded-lg bg-brand-cream/40">
              <img src={imagePreview} alt="Preview" className="w-16 h-16 object-contain rounded border border-brand-border bg-white" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-brand-dark truncate">{imageFile?.name}</p>
                <p className="text-xs text-gray-400">{imageFile ? (imageFile.size / 1024).toFixed(0) + ' KB' : ''}</p>
              </div>
              <button type="button" onClick={clearImage} className="text-gray-400 hover:text-red-500 shrink-0">
                <X size={16} />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-brand-border rounded-lg p-6 cursor-pointer hover:border-brand-mid transition-colors bg-brand-cream/20">
              <ImageIcon size={28} className="text-gray-400" />
              <span className="text-sm text-gray-500">Click to select image</span>
              <span className="text-xs text-gray-400">PNG, JPG, SVG — max 2 MB</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleImagePick} />
            </label>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={isSubmitting || uploadingImg}
            className="btn-primary flex-1 py-3"
          >
            {isSubmitting ? 'Creating…' : uploadingImg ? 'Uploading image…' : 'Create Template'}
          </button>
          <Link to="/dashboard/templates" className="btn-secondary px-6 py-3">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
