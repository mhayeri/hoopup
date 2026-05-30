import { useRef, useState, type ChangeEvent } from 'react';
import { supabase } from '../../lib/supabase';
import { friendlyMessage } from '../../lib/errors';

type Props = {
  userId: string;
  currentUrl: string | null;
  onUploaded: (publicUrl: string) => void | Promise<void>;
  // When false, render only the upload control (no avatar circle). The header
  // supplies the circle separately, so the control can sit on its own row.
  showAvatar?: boolean;
};

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);

export default function AvatarUpload({ userId, currentUrl, onUploaded, showAvatar = true }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    if (!ALLOWED.has(file.type)) {
      setError('Use PNG, JPG, WEBP, or GIF.');
      return;
    }
    if (file.size > MAX_BYTES) {
      setError('File must be under 5 MB.');
      return;
    }

    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png';
    // Path must start with the user's id — Storage RLS only lets us write
    // to our own folder.
    const path = `${userId}/avatar-${Date.now()}.${ext}`;

    setUploading(true);
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: false, contentType: file.type });

    if (uploadError) {
      setUploading(false);
      setError(friendlyMessage(uploadError));
      return;
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    setUploading(false);
    await onUploaded(data.publicUrl);

    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  const control = (
    <div>
      <label className="inline-block cursor-pointer rounded-full border border-[var(--color-blue)]/50 px-4 py-2 text-sm font-semibold text-[var(--color-bone)] transition hover:bg-[var(--color-blue)]/10">
        {uploading ? 'Uploading…' : currentUrl ? 'Replace photo' : 'Upload photo'}
        <input
          ref={fileInputRef}
          type="file"
          accept={[...ALLOWED].join(',')}
          onChange={handleChange}
          disabled={uploading}
          className="hidden"
        />
      </label>
      <p className="mt-1 text-xs text-[var(--color-bone)]/55">PNG, JPG, WEBP, or GIF. 5 MB max.</p>
      {error ? (
        <p role="alert" className="mt-2 text-sm text-red-300">
          {error}
        </p>
      ) : null}
    </div>
  );

  if (!showAvatar) return control;

  return (
    <div className="flex items-center gap-4">
      <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[var(--color-blue)]/40 bg-[var(--color-night-3)]">
        {currentUrl ? (
          <img src={currentUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="text-xs uppercase tracking-widest text-[var(--color-bone)]/60">
            no pic
          </span>
        )}
      </div>
      {control}
    </div>
  );
}
