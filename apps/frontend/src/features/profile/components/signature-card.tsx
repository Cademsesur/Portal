'use client';

import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Eraser, PenLine, Trash2, Upload } from 'lucide-react';
import {
  deleteMySignature,
  getMySignature,
  setMySignature,
} from '@/features/profile/api/signature.api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/toaster';

const SIGNATURE_KEY = ['users', 'me', 'signature'];

/** Convertit un fichier image en PNG (data URL), normalisé via un canvas. */
function fileToPng(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 800;
        const scale = Math.min(max / img.width, max / img.height, 1);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas indisponible'));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => reject(new Error('Image invalide'));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error('Lecture du fichier impossible'));
    reader.readAsDataURL(file);
  });
}

export function SignatureCard() {
  const queryClient = useQueryClient();
  const { data: currentUrl, isLoading } = useQuery({
    queryKey: SIGNATURE_KEY,
    queryFn: async () => {
      const blob = await getMySignature();
      return blob ? URL.createObjectURL(blob) : null;
    },
    staleTime: 60_000,
  });

  const [draft, setDraft] = useState<string | null>(null);

  const saveMutation = useMutation({
    mutationFn: (image: string) => setMySignature(image),
    onSuccess: () => {
      toast.success('Signature enregistrée');
      setDraft(null);
      queryClient.invalidateQueries({ queryKey: SIGNATURE_KEY });
    },
    onError: () => toast.error("Échec de l'enregistrement de la signature"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteMySignature(),
    onSuccess: () => {
      toast.success('Signature supprimée');
      setDraft(null);
      queryClient.invalidateQueries({ queryKey: SIGNATURE_KEY });
    },
    onError: () => toast.error('Échec de la suppression'),
  });

  const busy = saveMutation.isPending || deleteMutation.isPending;

  return (
    <Card className="p-6">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-soft text-primary-soft-foreground">
          <PenLine className="h-4 w-4" />
        </span>
        <div>
          <h2 className="text-sm font-semibold text-foreground">Ma signature</h2>
          <p className="text-xs text-muted-foreground">
            Apposée sur vos fiches de demande générées (PDF / Word).
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-border bg-muted/30 p-3">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Signature actuelle
        </div>
        <div className="mt-2 flex h-24 items-center justify-center rounded-md bg-card">
          {isLoading ? (
            <span className="text-xs text-muted-foreground">Chargement…</span>
          ) : currentUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={currentUrl}
              alt="Signature"
              className="max-h-20 max-w-full object-contain"
            />
          ) : (
            <span className="text-xs text-muted-foreground">
              Aucune signature enregistrée
            </span>
          )}
        </div>
        {currentUrl && !draft && (
          <div className="mt-2 flex justify-end">
            <Button
              variant="destructive-outline"
              size="sm"
              loading={deleteMutation.isPending}
              disabled={busy}
              onClick={() => deleteMutation.mutate()}
            >
              <Trash2 />
              Supprimer
            </Button>
          </div>
        )}
      </div>

      <Tabs defaultValue="draw" className="mt-4">
        <TabsList>
          <TabsTrigger value="draw">
            <PenLine className="h-3.5 w-3.5" />
            Dessiner
          </TabsTrigger>
          <TabsTrigger value="upload">
            <Upload className="h-3.5 w-3.5" />
            Téléverser
          </TabsTrigger>
        </TabsList>

        <TabsContent value="draw">
          <SignaturePad onChange={setDraft} />
        </TabsContent>

        <TabsContent value="upload">
          <UploadPad onChange={setDraft} />
        </TabsContent>
      </Tabs>

      {draft && (
        <div className="mt-4 flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" disabled={busy} onClick={() => setDraft(null)}>
            Annuler
          </Button>
          <Button
            size="sm"
            loading={saveMutation.isPending}
            disabled={busy}
            onClick={() => saveMutation.mutate(draft)}
          >
            Enregistrer la signature
          </Button>
        </div>
      )}
    </Card>
  );
}

function SignaturePad({ onChange }: { onChange: (dataUrl: string | null) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const dirty = useRef(false);

  const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    drawing.current = true;
    const ctx = canvasRef.current!.getContext('2d')!;
    const { x, y } = pos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    canvasRef.current!.setPointerCapture(e.pointerId);
  };

  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current!.getContext('2d')!;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0f2c4d';
    const { x, y } = pos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    dirty.current = true;
  };

  const end = () => {
    if (!drawing.current) return;
    drawing.current = false;
    if (dirty.current) onChange(canvasRef.current!.toDataURL('image/png'));
  };

  const clear = () => {
    const canvas = canvasRef.current!;
    canvas.getContext('2d')!.clearRect(0, 0, canvas.width, canvas.height);
    dirty.current = false;
    onChange(null);
  };

  return (
    <div className="space-y-2">
      <canvas
        ref={canvasRef}
        width={560}
        height={180}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerLeave={end}
        className="h-44 w-full touch-none rounded-md border border-dashed border-border bg-card"
      />
      <div className="flex justify-between">
        <p className="text-[11px] text-muted-foreground">
          Tracez votre signature dans le cadre.
        </p>
        <Button variant="ghost" size="sm" onClick={clear}>
          <Eraser />
          Effacer
        </Button>
      </div>
    </div>
  );
}

function UploadPad({ onChange }: { onChange: (dataUrl: string | null) => void }) {
  const [preview, setPreview] = useState<string | null>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const png = await fileToPng(file);
      setPreview(png);
      onChange(png);
    } catch {
      toast.error('Image invalide');
    }
  };

  return (
    <div className="space-y-3">
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border bg-card p-6 text-center transition-colors hover:bg-muted/40">
        <Upload className="h-5 w-5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">
          Cliquez pour choisir une image (PNG, JPG)
        </span>
        <input
          type="file"
          accept="image/png,image/jpeg"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </label>
      {preview && (
        <div className="flex h-24 items-center justify-center rounded-md border border-border bg-card">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Aperçu" className="max-h-20 max-w-full object-contain" />
        </div>
      )}
    </div>
  );
}
