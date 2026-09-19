import { ImageIcon, TrashIcon, UploadCloudIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/components/ui/toast';
import { useAuthContext } from '@/contexts/auth';

const countries = [
  {
    value: 'brazil',
    label: 'Brasil',
    flag: 'https://cdn.shadcnstudio.com/ss-assets/flags/india.png', // Fallback or flag icon
  },
  {
    value: 'united-states',
    label: 'Estados Unidos',
    flag: 'https://cdn.shadcnstudio.com/ss-assets/flags/monaco.png',
  },
  {
    value: 'portugal',
    label: 'Portugal',
    flag: 'https://cdn.shadcnstudio.com/ss-assets/flags/serbia.png',
  },
  {
    value: 'spain',
    label: 'Espanha',
    flag: 'https://cdn.shadcnstudio.com/ss-assets/flags/romania.png',
  },
];

const PersonalInfoForm = () => {
  const { user } = useAuthContext();
  const inputRef = useRef(null);

  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [prevUser, setPrevUser] = useState(user);
  const [mobile, setMobile] = useState('');
  const [country, setCountry] = useState('brazil');
  const [gender, setGender] = useState('other');
  const [role, setRole] = useState('user');

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

  const onSelect = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith('image/')) {
      toast.add({
        type: 'error',
        title: 'Formato inválido',
        description: 'Por favor, selecione um arquivo de imagem.',
      });
      e.currentTarget.value = '';
      return;
    }

    if (selectedFile.size > 1024 * 1024) {
      toast.add({
        type: 'error',
        title: 'Arquivo muito grande',
        description: 'A imagem deve ter no máximo 1MB.',
      });
      e.currentTarget.value = '';
      return;
    }

    setFile(selectedFile);
  };

  const openPicker = () => inputRef.current?.click();

  const removeAvatar = () => {
    setFile(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    toast.add({
      type: 'success',
      title: 'Informações salvas com sucesso!',
      description: 'Seus dados pessoais foram atualizados.',
    });
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
                onClick={openPicker}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openPicker();
                  }
                }}
                className="flex size-20 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-dashed hover:opacity-95"
              >
                {preview ? (
                  <img
                    src={preview}
                    alt="Pré-visualização do avatar"
                    className="size-full object-cover"
                  />
                ) : (
                  <ImageIcon className="text-muted-foreground size-8" />
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onSelect}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={openPicker}
                  className="flex items-center gap-2"
                >
                  <UploadCloudIcon className="size-4" />
                  Enviar avatar
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={removeAvatar}
                  disabled={!file}
                  className="text-destructive!"
                >
                  <TrashIcon className="size-4" />
                </Button>
              </div>
            </div>
            <p className="text-muted-foreground text-sm">
              Escolha uma foto de até 1MB nos formatos JPG ou PNG.
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

            <div className="flex flex-col items-start gap-2">
              <Label htmlFor="mobile">Celular</Label>
              <Input
                id="mobile"
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="+55 (11) 99999-9999"
              />
            </div>

            <div className="flex flex-col items-start gap-2">
              <Label htmlFor="country">País</Label>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger id="country" className="w-full">
                  <SelectValue placeholder="Selecione o país" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {countries.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      <span className="truncate">{c.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Gênero</Label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger id="gender" className="w-full">
                  <SelectValue placeholder="Selecione o gênero" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="male">Masculino</SelectItem>
                    <SelectItem value="female">Feminino</SelectItem>
                    <SelectItem value="other">
                      Outro / Prefiro não dizer
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Função / Perfil</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger id="role" className="w-full">
                  <SelectValue placeholder="Selecione a função" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="user">Usuário</SelectItem>
                    <SelectItem value="other">Outro</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" className="max-sm:w-full">
              Salvar alterações
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PersonalInfoForm;
