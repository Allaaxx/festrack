import { PlusIcon, Trash2Icon } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/toast';

const SocialUrlsCard = () => {
  const [urls, setUrls] = useState([
    'https://github.com',
    'https://linkedin.com',
  ]);

  const addUrl = () => setUrls((prev) => [...prev, '']);

  const removeUrl = (index) => {
    setUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const updateUrl = (index, value) => {
    setUrls((prev) => prev.map((u, i) => (i === index ? value : u)));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    toast.add({
      type: 'success',
      title: 'Links sociais salvos com sucesso!',
      description: 'Seus perfis públicos foram atualizados.',
    });
  };

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
      <div className="flex flex-col space-y-1">
        <h3 className="font-semibold">Redes Sociais</h3>
        <p className="text-muted-foreground text-sm">
          Adicione links para seus perfis profissionais ou redes sociais.
        </p>
      </div>

      <div className="space-y-6 lg:col-span-2">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            {urls.map((url, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Input
                  type="url"
                  placeholder="https://exemplo.com/seu-perfil"
                  value={url}
                  onChange={(e) => updateUrl(idx, e.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-destructive! shrink-0"
                  onClick={() => removeUrl(idx)}
                  disabled={urls.length <= 1}
                  aria-label="Remover link"
                >
                  <Trash2Icon className="size-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between gap-4">
            <Button type="button" variant="outline" onClick={addUrl}>
              <PlusIcon className="size-4" />
              Adicionar URL
            </Button>
            <Button type="submit">Salvar alterações</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SocialUrlsCard;
