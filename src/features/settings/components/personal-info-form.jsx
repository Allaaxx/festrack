import { Loader2Icon } from 'lucide-react';
import { useState } from 'react';

import { useUpdateProfile, useUploadAvatar } from '@/api/hooks/user';
import Dropzone from '@/components/shared/dropzone';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/toast';
import { useAuthContext } from '@/contexts/auth';

const PersonalInfoForm = () => {
  const { user, updateUser } = useAuthContext();
  const updateProfileMutation = useUpdateProfile();
  const uploadAvatarMutation = useUploadAvatar();

  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [prevUser, setPrevUser] = useState(user);

  if (user !== prevUser) {
    setPrevUser(user);
    setFirstName(user?.firstName ?? '');
    setLastName(user?.lastName ?? '');
  }

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
            <Dropzone
              multiple={false}
              accept={{
                'image/jpeg': ['.jpg', '.jpeg'],
                'image/png': ['.png'],
                'image/webp': ['.webp'],
              }}
              maxSize={5 * 1024 * 1024}
              initialPreviewUrl={user?.image}
              previewAlt="Avatar do usuário"
              isUploading={uploadAvatarMutation.isPending}
              disabled={uploadAvatarMutation.isPending}
              onChange={async (selectedFile) => {
                if (!selectedFile) return;
                try {
                  const updatedUser =
                    await uploadAvatarMutation.mutateAsync(selectedFile);
                  updateUser(updatedUser);
                  toast.add({
                    type: 'success',
                    title: 'Avatar atualizado com sucesso!',
                    description: 'Sua foto de perfil foi alterada.',
                  });
                } catch (error) {
                  console.error(error);
                  toast.add({
                    type: 'error',
                    title: 'Erro ao enviar avatar',
                    description:
                      error?.message ||
                      'Por favor, tente novamente mais tarde.',
                  });
                }
              }}
              onError={({ message }) => {
                toast.add({
                  type: 'error',
                  title: 'Arquivo inválido',
                  description: message,
                });
              }}
            />
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
