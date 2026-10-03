import {
  ImageIcon,
  Loader2Icon,
  TrashIcon,
  UploadCloudIcon,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { useUpdateProfile, useUploadAvatar } from '@/api/hooks/user';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/toast';
import { useAuthContext } from '@/contexts/auth';
import { cn } from '@/lib/utils';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const PersonalInfoForm = () => {
  const { user, updateUser } = useAuthContext();
  const updateProfileMutation = useUpdateProfile();
  const uploadAvatarMutation = useUploadAvatar();
  const inputRef = useRef(null);

  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [prevUser, setPrevUser] = useState(user);

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);

  if (user !== prevUser) {
    setPrevUser(user);
    setFirstName(user?.firstName ?? '');
    setLastName(user?.lastName ?? '');
  }

  useEffect(() => {
    if (!file) {
      const t = window.setTimeout(() => setPreview(null), 0);
      return () => clearTimeout(t);
    }

    const url = URL.createObjectURL(file);
    const t = window.setTimeout(() => setPreview(url), 0);

    return () => {
      clearTimeout(t);
      URL.revokeObjectURL(url);
    };
  }, [file]);

  const onSelect = async (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!ALLOWED_MIME_TYPES.includes(selectedFile.type)) {
      toast.add({
        type: 'error',
        title: 'Formato inválido',
        description:
          'Por favor, selecione um arquivo de imagem válido (JPG, PNG ou WebP).',
      });
      if (inputRef.current) inputRef.current.value = '';
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      toast.add({
        type: 'error',
        title: 'Arquivo muito grande',
        description: 'A imagem deve ter no máximo 5MB.',
      });
      if (inputRef.current) inputRef.current.value = '';
      return;
    }

    setFile(selectedFile);

    try {
      const updatedUser = await uploadAvatarMutation.mutateAsync(selectedFile);
      updateUser(updatedUser);
      toast.add({
        type: 'success',
        title: 'Avatar atualizado com sucesso!',
        description: 'Sua foto de perfil foi alterada.',
      });
      setFile(null);
    } catch (error) {
      console.error(error);
      toast.add({
        type: 'error',
        title: 'Erro ao enviar avatar',
        description: error?.message || 'Por favor, tente novamente mais tarde.',
      });
      setFile(null);
    } finally {
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const openPicker = () => {
    if (uploadAvatarMutation.isPending) return;
    inputRef.current?.click();
  };

  const removeAvatar = () => {
    setFile(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const updatedUser = await updateProfileMutation.mutateAsync({
        firstName,
        lastName,
      });
      updateUser(updatedUser);
      toast.add({
        type: 'success',
        title: 'Informações salvas com sucesso!',
        description: 'Seus dados pessoais foram atualizados.',
      });
    } catch (error) {
      console.error(error);
      toast.add({
        type: 'error',
        title: 'Erro ao atualizar perfil',
        description: error?.message || 'Por favor, tente novamente mais tarde.',
      });
    }
  };

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
      <div className="flex flex-col space-y-1">
        <h3 className="font-semibold">Informações Pessoais</h3>
        <p className="text-muted-foreground text-sm">
          Atualize suas informações de contato e preferências de perfil.
        </p>
      </div>

      <div className="space-y-6 lg:col-span-2">
        <form onSubmit={handleSubmit} className="mx-auto space-y-6">
          <div className="space-y-2">
            <Label>Seu Avatar</Label>
            <div className="flex items-center gap-4">
              <div
                role="button"
                tabIndex={0}
                aria-label="Carregar foto de perfil"
                aria-disabled={uploadAvatarMutation.isPending}
                onClick={openPicker}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openPicker();
                  }
                }}
                className={cn(
                  'relative flex size-20 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-dashed hover:opacity-95',
                  uploadAvatarMutation.isPending &&
                    'pointer-events-none cursor-not-allowed opacity-80'
                )}
              >
                {preview ? (
                  <img
                    src={preview}
                    alt="Pré-visualização do avatar"
                    className="size-full object-cover"
                  />
                ) : user?.image ? (
                  <img
                    src={user.image}
                    alt="Avatar do usuário"
                    className="size-full object-cover"
                  />
                ) : (
                  <ImageIcon className="text-muted-foreground size-8" />
                )}

                {uploadAvatarMutation.isPending && (
                  <div className="bg-background/70 absolute inset-0 flex items-center justify-center">
                    <Loader2Icon
                      data-testid="avatar-loading-spinner"
                      className="text-foreground size-6 animate-spin"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={onSelect}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={openPicker}
                  disabled={uploadAvatarMutation.isPending}
                  className="flex items-center gap-2"
                >
                  {uploadAvatarMutation.isPending ? (
                    <Loader2Icon className="size-4 animate-spin" />
                  ) : (
                    <UploadCloudIcon className="size-4" />
                  )}
                  Enviar avatar
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  aria-label="Remover avatar"
                  onClick={removeAvatar}
                  disabled={!file || uploadAvatarMutation.isPending}
                  className="text-destructive!"
                >
                  <TrashIcon className="size-4" />
                </Button>
              </div>
            </div>
            <p className="text-muted-foreground text-sm">
              Escolha uma foto de até 5MB nos formatos JPG, PNG ou WebP.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="flex flex-col items-start gap-2">
              <Label htmlFor="first-name">Nome</Label>
              <Input
                id="first-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Seu primeiro nome"
              />
            </div>

            <div className="flex flex-col items-start gap-2">
              <Label htmlFor="last-name">Sobrenome</Label>
              <Input
                id="last-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Seu sobrenome"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={updateProfileMutation.isPending}
              className="max-sm:w-full"
            >
              {updateProfileMutation.isPending ? (
                <>
                  <Loader2Icon className="mr-2 size-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar alterações'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PersonalInfoForm;
